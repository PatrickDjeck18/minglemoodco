import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import * as speakeasy from 'npm:speakeasy@2.0.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Verify2FALoginRequest {
  email: string;
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

    const { email, token }: Verify2FALoginRequest = await req.json();

    console.log('🔐 Verifying 2FA login token for:', email);

    // Get user's 2FA secret and backup codes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, two_factor_secret, two_factor_backup_codes, two_factor_enabled')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error loading user profile:', profileError);
      throw new Error('Nie znaleziono profilu użytkownika');
    }

    if (!profile.two_factor_enabled || !profile.two_factor_secret) {
      throw new Error('2FA nie jest włączone dla tego użytkownika');
    }

    console.log('🔍 Verifying token for user:', profile.id);

    // Check if it's a backup code first
    let verified = false;
    let updatedBackupCodes = profile.two_factor_backup_codes;

    if (profile.two_factor_backup_codes && profile.two_factor_backup_codes.includes(token.toUpperCase())) {
      // It's a backup code - use it and remove from list
      verified = true;
      updatedBackupCodes = profile.two_factor_backup_codes.filter(code => code !== token.toUpperCase());
      
      // Update backup codes in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ two_factor_backup_codes: updatedBackupCodes })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ Error updating backup codes:', updateError);
      }

      console.log('🔑 Used backup code for login');
    } else {
      // Verify the TOTP token
      verified = speakeasy.totp.verify({
        secret: profile.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps (60 seconds) tolerance
      });
      console.log('🔍 TOTP verification result:', verified);
    }

    if (verified) {
      console.log('✅ 2FA verification successful for:', email);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          role: profile.role,
          message: '2FA zweryfikowane pomyślnie'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } else {
      console.log('❌ Invalid 2FA token for login');
      
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
    console.error('❌ Error verifying 2FA login:', error);
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