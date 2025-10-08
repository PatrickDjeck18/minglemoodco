import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import * as speakeasy from 'npm:speakeasy@2.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Disable2FARequest {
  userId: string;
  token: string;
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

    const { userId, token }: Disable2FARequest = await req.json();

    console.log('🔐 Disabling 2FA for user:', userId);

    // Get user's 2FA secret
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('two_factor_secret, two_factor_backup_codes')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error loading user profile:', profileError);
      throw new Error('Nie znaleziono profilu użytkownika');
    }

    if (!profile.two_factor_secret) {
      throw new Error('2FA nie jest włączone dla tego użytkownika');
    }

    // Check if it's a backup code
    let verified = false;
    let updatedBackupCodes = profile.two_factor_backup_codes;

    if (profile.two_factor_backup_codes && profile.two_factor_backup_codes.includes(token.toUpperCase())) {
      // It's a backup code
      verified = true;
      updatedBackupCodes = profile.two_factor_backup_codes.filter(code => code !== token.toUpperCase());
      console.log('🔑 Used backup code for 2FA disable');
    } else {
      // Verify the TOTP token
      verified = speakeasy.totp.verify({
        secret: profile.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      console.log('🔍 TOTP verification result:', verified);
    }

    if (verified) {
      // Disable 2FA
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_secret_temp: null,
          two_factor_backup_codes: null
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error disabling 2FA:', updateError);
        throw new Error('Błąd wyłączania 2FA');
      }

      console.log('✅ 2FA disabled successfully');

      return new Response(
        JSON.stringify({
          success: true,
          disabled: true,
          message: '2FA zostało wyłączone pomyślnie'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      console.log('❌ Invalid 2FA token for disable');
      
      return new Response(
        JSON.stringify({
          success: false,
          disabled: false,
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
    console.error('❌ Error disabling 2FA:', error);
    return new Response(
      JSON.stringify({
        success: false,
        disabled: false,
        error: error.message || 'Błąd wyłączania 2FA'
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