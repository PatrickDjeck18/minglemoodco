import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import * as speakeasy from 'npm:speakeasy@2.0.0';
import QRCode from 'npm:qrcode@1.5.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Setup2FARequest {
  userId: string;
  email: string;
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

    const { userId, email }: Setup2FARequest = await req.json();

    console.log('🔐 Setting up 2FA for user:', userId);

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Centrum Audytu (${email})`,
      issuer: 'Centrum Audytu',
      length: 32
    });

    console.log('🔑 Generated 2FA secret');

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    console.log('📱 Generated QR code');

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      backupCodes.push(code);
    }

    console.log('🔑 Generated backup codes');

    // Store secret temporarily (will be saved permanently after verification)
    const { error: tempError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret_temp: secret.base32,
        two_factor_backup_codes: backupCodes
      })
      .eq('id', userId);

    if (tempError) {
      console.error('❌ Error storing temp secret:', tempError);
      throw new Error('Błąd zapisywania tymczasowego klucza 2FA');
    }

    console.log('✅ 2FA setup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        message: 'Klucz 2FA został wygenerowany'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error setting up 2FA:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Błąd konfiguracji 2FA'
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