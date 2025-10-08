import { createClient } from 'npm:@supabase/supabase-js@2.56.0';
import { Resend } from 'npm:resend@3.2.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface InvitationRequest {
  email: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  baseUrl?: string;
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

    // Initialize Resend with API key
    const resend = new Resend('re_XgY5gPKm_DMjSzTmLrZGWaKLSMBDWYhsU');

    const { email, groupId, groupName, inviterName, baseUrl: providedBaseUrl }: InvitationRequest = await req.json();

    console.log('📧 Processing invitation for:', email, 'to group:', groupName);

    // Get invitation token from database
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('token')
      .eq('email', email)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (inviteError || !invitation) {
      console.error('❌ Invitation not found:', inviteError);
      throw new Error('Nie znaleziono zaproszenia');
    }

    // Create invitation link - use request origin or fallback
    const baseUrl = providedBaseUrl || req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    console.log('🔗 Generated invite URL:', inviteUrl);

    // Professional email template inspired by Google's design
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zaproszenie do Centrum Audytu</title>
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
          
          .invitation-card {
            background: linear-gradient(135deg, #f8f9ff 0%, #f1f3ff 100%);
            border: 2px solid #e8eaff;
            border-radius: 16px;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .invitation-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #1a73e8, #4285f4, #34a853, #fbbc04, #ea4335);
          }
          
          .group-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #1a73e8, #4285f4);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 4px 16px rgba(26, 115, 232, 0.3);
          }
          
          .group-name {
            font-size: 24px;
            font-weight: 500;
            color: #1a73e8;
            margin-bottom: 8px;
          }
          
          .group-subtitle {
            font-size: 16px;
            color: #5f6368;
            margin-bottom: 24px;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 500;
            font-size: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 16px rgba(26, 115, 232, 0.3);
            border: none;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(26, 115, 232, 0.4);
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
          
          .steps-section {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
          }
          
          .steps-title {
            font-size: 18px;
            font-weight: 500;
            color: #202124;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
          }
          
          .steps-list {
            list-style: none;
            padding: 0;
          }
          
          .steps-list li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
            font-size: 15px;
            color: #5f6368;
          }
          
          .step-number {
            background: #1a73e8;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
            flex-shrink: 0;
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
            
            .invitation-card {
              padding: 24px;
              margin: 24px 0;
            }
            
            .footer {
              padding: 24px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .group-name {
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
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>Zaproszenie do platformy szkoleniowej</h1>
            <p>Centrum Audytu</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dzień dobry,
            </div>
            
            <p style="font-size: 16px; color: #5f6368; margin-bottom: 24px; line-height: 1.6;">
              <strong>${inviterName}</strong> zaprasza Państwa do dołączenia do grupy szkoleniowej 
              w nowoczesnej platformie e-learningowej Centrum Audytu.
            </p>
            
            <div class="invitation-card">
              <div class="group-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="group-name">${groupName}</div>
              <div class="group-subtitle">Grupa szkoleniowa</div>
              <p style="font-size: 15px; color: #5f6368; margin-bottom: 32px; line-height: 1.5;">
                Dołącz do grupy i uzyskaj dostęp do przydzielonych szkoleń, egzaminów oraz materiałów edukacyjnych.
              </p>
              <a href="${inviteUrl}" class="cta-button">
                <span style="position: relative; z-index: 1;">🚀 Dołącz do grupy</span>
              </a>
            </div>
            
            <div class="steps-section">
              <div class="steps-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
                  <path d="M9 11L12 14L22 4" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Jak to działa?
              </div>
              <ol class="steps-list">
                <li>
                  <div class="step-number">1</div>
                  <div>Kliknij przycisk "Dołącz do grupy" powyżej</div>
                </li>
                <li>
                  <div class="step-number">2</div>
                  <div>Utwórz nowe konto lub zaloguj się (jeśli już posiadasz)</div>
                </li>
                <li>
                  <div class="step-number">3</div>
                  <div>Zostaniesz automatycznie dodany do grupy</div>
                </li>
                <li>
                  <div class="step-number">4</div>
                  <div>Uzyskasz dostęp do przydzielonych szkoleń i egzaminów</div>
                </li>
              </ol>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 15px; color: #5f6368; line-height: 1.6; margin-bottom: 16px;">
              <strong>Centrum Audytu</strong> to nowoczesna platforma e-learningowa oferująca:
            </p>
            
            <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
              <li style="display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; color: #5f6368;">
                <span style="color: #34a853; margin-right: 8px;">✓</span>
                Interaktywne szkolenia online
              </li>
              <li style="display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; color: #5f6368;">
                <span style="color: #34a853; margin-right: 8px;">✓</span>
                Egzaminy z automatyczną oceną
              </li>
              <li style="display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; color: #5f6368;">
                <span style="color: #34a853; margin-right: 8px;">✓</span>
                Certyfikaty ukończenia
              </li>
              <li style="display: flex; align-items: center; margin-bottom: 8px; font-size: 15px; color: #5f6368;">
                <span style="color: #34a853; margin-right: 8px;">✓</span>
                Śledzenie postępów w nauce
              </li>
            </ul>
            
            <div class="warning-box">
              <div class="warning-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 17H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 1L3 5L12 9L21 5L12 1Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="warning-text">
                <strong>Ważne:</strong> Link zapraszający jest ważny przez 7 dni od wysłania tej wiadomości. 
                Po tym czasie zaproszenie wygaśnie i będzie konieczne wysłanie nowego.
              </div>
            </div>
            
            <p style="font-size: 14px; color: #5f6368; line-height: 1.6; margin-top: 32px;">
              Jeśli nie spodziewali się Państwo tego zaproszenia lub otrzymali je przez pomyłkę, 
              można zignorować tę wiadomość. Państwa dane nie zostaną dodane do systemu bez wyrażenia zgody.
            </p>
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
              <a href="https://centrumaudytu.pl/regulamin" class="footer-link">Regulamin</a>
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
    console.log('📧 Sending email via Resend to:', email);
    
    const emailData = await resend.emails.send({
      from: 'Centrum Audytu <no-reply@mail.academyca.pl>',
      to: [email],
      subject: `Zaproszenie do grupy "${groupName}" - Centrum Audytu`,
      html: emailHtml,
      text: `
Zaproszenie do Centrum Audytu

Dzień dobry,

${inviterName} zaprasza Państwa do dołączenia do grupy szkoleniowej "${groupName}" w platformie Centrum Audytu.

Aby dołączyć do grupy, kliknij w poniższy link:
${inviteUrl}

Jak to działa:
1. Kliknij link zapraszający
2. Utwórz nowe konto lub zaloguj się
3. Zostaniesz automatycznie dodany do grupy
4. Uzyskasz dostęp do przydzielonych szkoleń

WAŻNE: Link jest ważny przez 7 dni od wysłania tej wiadomości.

Jeśli nie spodziewali się Państwo tego zaproszenia, można zignorować tę wiadomość.

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

    console.log('✅ Email sent successfully via Resend:', emailData.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Zaproszenie zostało wysłane na ${email}`,
        emailId: emailData.data?.id,
        inviteUrl: inviteUrl
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('❌ Error sending invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Błąd wysyłania zaproszenia' 
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