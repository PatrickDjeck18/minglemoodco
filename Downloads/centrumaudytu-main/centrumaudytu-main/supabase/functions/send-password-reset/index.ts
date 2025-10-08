import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PasswordResetRequest {
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

    const resend = new Resend('re_XgY5gPKm_DMjSzTmLrZGWaKLSMBDWYhsU');

    const { email }: PasswordResetRequest = await req.json();

    console.log('🔐 Processing password reset request for:', email);

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'Jeśli podałeś poprawny e-mail, wysłaliśmy link resetujący hasło.';

    if (profileError || !profile) {
      console.log('❌ User not found, but returning success for security');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: successMessage
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Cleanup expired tokens first
    await supabase.rpc('cleanup_expired_reset_tokens');

    // Generate reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email: email,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })
      .select('token')
      .single();

    if (tokenError) {
      console.error('❌ Error creating reset token:', tokenError);
      throw new Error('Błąd generowania tokenu resetującego');
    }

    const resetToken = tokenData.token;
    const baseUrl = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log('🔗 Generated reset URL:', resetUrl);

    // Professional email template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset hasła - Centrum Audytu</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            color: #202124; 
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            border: 1px solid #e8eaed;
          }
          
          .header {
            background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
            padding: 48px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(0deg); }
            50% { transform: translateX(0%) translateY(0%) rotate(180deg); }
          }
          
          .logo {
            width: 64px;
            height: 64px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          
          .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 500;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            font-weight: 400;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 48px 32px;
          }
          
          .greeting {
            font-size: 18px;
            color: #202124;
            margin-bottom: 24px;
            font-weight: 400;
          }
          
          .reset-card {
            background: linear-gradient(135deg, #fff3e0 0%, #ffe8cc 100%);
            border: 2px solid #ff9800;
            border-radius: 16px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .reset-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff9800, #f57c00, #e65100);
          }
          
          .security-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #ff9800, #f57c00);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
          }
          
          .reset-title {
            font-size: 24px;
            font-weight: 500;
            color: #e65100;
            margin-bottom: 8px;
          }
          
          .reset-subtitle {
            font-size: 16px;
            color: #bf360c;
            margin-bottom: 24px;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 500;
            font-size: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
            border: none;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 152, 0, 0.4);
          }
          
          .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .cta-button:hover::before {
            left: 100%;
          }
          
          .security-notice {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 1px solid #2196f3;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            display: flex;
            align-items: flex-start;
          }
          
          .security-notice-icon {
            width: 24px;
            height: 24px;
            background: #2196f3;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .security-notice-text {
            font-size: 14px;
            color: #0d47a1;
            line-height: 1.5;
          }
          
          .warning-box {
            background: linear-gradient(135deg, #fef7e0 0%, #fef3c7 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            display: flex;
            align-items: flex-start;
          }
          
          .warning-icon {
            width: 24px;
            height: 24px;
            background: #f59e0b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .warning-text {
            font-size: 14px;
            color: #92400e;
            line-height: 1.5;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e8eaed;
          }
          
          .footer-logo {
            font-size: 20px;
            font-weight: 600;
            color: #1a73e8;
            margin-bottom: 16px;
          }
          
          .footer-info {
            color: #5f6368;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .footer-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e8eaed;
          }
          
          .footer-link {
            color: #1a73e8;
            text-decoration: none;
            font-size: 14px;
            margin: 0 12px;
            transition: color 0.2s;
          }
          
          .footer-link:hover {
            color: #1557b0;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e8eaed, transparent);
            margin: 32px 0;
          }
          
          /* Mobile responsiveness */
          @media (max-width: 600px) {
            .email-container {
              margin: 20px;
              border-radius: 12px;
            }
            
            .header {
              padding: 32px 24px;
            }
            
            .content {
              padding: 32px 24px;
            }
            
            .reset-card {
              padding: 24px;
              margin: 24px 0;
            }
            
            .footer {
              padding: 24px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .reset-title {
              font-size: 20px;
            }
            
            .cta-button {
              padding: 14px 24px;
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5L12 9L21 5L12 1Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M3 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M3 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>Reset hasła</h1>
            <p>Centrum Audytu</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dzień dobry,
            </div>
            
            <p style="font-size: 16px; color: #5f6368; margin-bottom: 24px; line-height: 1.6;">
              Otrzymaliśmy prośbę o reset hasła dla Państwa konta w platformie <strong>Centrum Audytu</strong>.
            </p>
            
            <div class="reset-card">
              <div class="security-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="reset-title">Ustaw nowe hasło</div>
              <div class="reset-subtitle">Kliknij poniższy przycisk, aby bezpiecznie zresetować hasło</div>
              <a href="${resetUrl}" class="cta-button">
                <span style="position: relative; z-index: 1;">🔐 Resetuj hasło</span>
              </a>
            </div>
            
            <div class="security-notice">
              <div class="security-notice-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="security-notice-text">
                <strong>Bezpieczeństwo:</strong> Link resetujący jest ważny przez 30 minut i może być użyty tylko raz. 
                Po kliknięciu zostaniesz przekierowany na bezpieczną stronę, gdzie będziesz mógł ustawić nowe hasło.
              </div>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 15px; color: #5f6368; line-height: 1.6; margin-bottom: 16px;">
              <strong>Nie prosiłeś o reset hasła?</strong>
            </p>
            
            <p style="font-size: 14px; color: #5f6368; line-height: 1.6;">
              Jeśli nie prosiłeś o reset hasła, możesz bezpiecznie zignorować tę wiadomość. 
              Twoje hasło pozostanie niezmienione. Zalecamy jednak sprawdzenie bezpieczeństwa konta.
            </p>
            
            <div class="warning-box">
              <div class="warning-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 17H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="warning-text">
                <strong>Ważne:</strong> Ze względów bezpieczeństwa nigdy nie udostępniaj tego linku innym osobom. 
                Link resetujący daje pełny dostęp do zmiany hasła w Twoim koncie.
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">Centrum Audytu</div>
            <div class="footer-info">ul. Żurawia 6/12/766</div>
            <div class="footer-info">00-503 Warszawa, Polska</div>
            <div class="footer-info">kontakt@centrumaudytu.pl</div>
            <div class="footer-info">+48 734 174 026</div>
            
            <div class="footer-links">
              <a href="https://centrumaudytu.pl" class="footer-link">Strona główna</a>
              <a href="https://centrumaudytu.pl/polityka-prywatnosci" class="footer-link">Polityka prywatności</a>
              <a href="https://centrumaudytu.pl/pomoc" class="footer-link">Pomoc</a>
            </div>
            
            <p style="font-size: 12px; color: #9aa0a6; margin-top: 20px;">
              © 2025 Centrum Audytu. Wszystkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    console.log('📧 Sending password reset email via Resend to:', email);
    
    const emailData = await resend.emails.send({
      from: 'Centrum Audytu <no-reply@mail.academyca.pl>',
      to: [email],
      subject: 'Reset hasła - Centrum Audytu',
      html: emailHtml,
      text: `
Reset hasła - Centrum Audytu

Dzień dobry,

Otrzymaliśmy prośbę o reset hasła dla Państwa konta w platformie Centrum Audytu.

Aby ustawić nowe hasło, kliknij w poniższy link:
${resetUrl}

WAŻNE: 
- Link jest ważny przez 30 minut
- Może być użyty tylko raz
- Ze względów bezpieczeństwa nie udostępniaj go innym

Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

---
Centrum Audytu
ul. Żurawia 6/12/766, 00-503 Warszawa
kontakt@centrumaudytu.pl
+48 734 174 026
      `.trim()
    });

    if (emailData.error) {
      console.error('❌ Resend API error:', emailData.error);
      throw new Error(`Błąd wysyłania emaila: ${emailData.error.message}`);
    }

    console.log('✅ Password reset email sent successfully via Resend:', emailData.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        emailId: emailData.data?.id
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error sending password reset:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Błąd wysyłania emaila resetującego hasło' 
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