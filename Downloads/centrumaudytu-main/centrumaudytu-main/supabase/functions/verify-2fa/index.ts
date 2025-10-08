import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import * as speakeasy from 'npm:speakeasy@2.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Verify2FARequest {
  userId: string;
  token: string;
  secret: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, token, secret }: Verify2FARequest = await req.json();

    console.log('🔐 Verifying 2FA token for user:', userId);

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    console.log('🔍 Token verification result:', verified);

    if (verified) {
      // Move temp secret to permanent and enable 2FA
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_secret: secret,
          two_factor_secret_temp: null
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error enabling 2FA:', updateError);
        throw new Error('Błąd włączania 2FA');
      }

      console.log('✅ 2FA enabled successfully');

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          message: '2FA zostało włączone pomyślnie'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      console.log('❌ Invalid 2FA token');
      
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error: 'Nieprawidłowy kod weryfikacyjny'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

  } catch (error: any) {
    console.error('❌ Error verifying 2FA:', error);
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: error.message || 'Błąd weryfikacji 2FA'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});