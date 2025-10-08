import { createClient } from 'npm:@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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

    const { token, newPassword }: ResetPasswordRequest = await req.json();

    console.log('🔐 Processing password reset with token:', token.substring(0, 8) + '...');

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.log('❌ Invalid or expired token');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token resetujący jest nieprawidłowy lub wygasł'
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

    console.log('✅ Valid token found for email:', tokenData.email);

    // Get user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', tokenData.email)
      .single();

    if (profileError || !profile) {
      console.error('❌ User not found:', profileError);
      throw new Error('Użytkownik nie został znaleziony');
    }

    // Update password using Supabase Auth Admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      throw new Error('Błąd aktualizacji hasła');
    }

    console.log('✅ Password updated successfully for user:', profile.id);

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    if (markUsedError) {
      console.error('❌ Error marking token as used:', markUsedError);
      // Don't fail the request if this fails
    }

    // Cleanup expired tokens
    await supabase.rpc('cleanup_expired_reset_tokens');

    console.log('🎉 Password reset completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hasło zostało pomyślnie zmienione'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error resetting password:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Błąd resetowania hasła'
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