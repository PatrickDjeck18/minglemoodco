// Email service for MingleMood - minimal working version
// Full template file is in /supabase/functions/server/email-service.tsx

const RESEND_API_URL = 'https://api.resend.com/emails';

// Basic email sending function
export async function sendEmail(emailData: any): Promise<boolean> {
  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not configured - emails disabled');
      return false;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MingleMood <noreply@minglemood.co>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      console.error('❌ Email send failed:', await response.text());
      return false;
    }

    console.log('✅ Email sent successfully to:', emailData.to);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
}

// Welcome email
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const emailData = {
    to: email,
    subject: 'Welcome to MingleMood! 🎉',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px;">
          <h1 style="color: white; margin: 0;">Welcome to MingleMood</h1>
        </div>
        <div style="background: white; padding: 30px; margin-top: 20px;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining MingleMood. Our team will review your profile within 10-14 days.</p>
          <p>What's next:</p>
          <ul>
            <li>Profile review (10-14 days)</li>
            <li>Complete your personalization survey</li>
            <li>Start receiving event invitations</li>
          </ul>
          <p>Questions? Contact us at <a href="mailto:hello@minglemood.co">hello@minglemood.co</a></p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Profile approved email
export async function sendProfileApprovedEmail(email: string, name: string): Promise<boolean> {
  const surveyLink = 'https://minglemood.co/#survey';
  
  const emailData = {
    to: email,
    subject: '🎉 Your MingleMood profile has been approved!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px;">
          <h1 style="color: white; margin: 0;">Profile Approved!</h1>
        </div>
        <div style="background: white; padding: 30px; margin-top: 20px;">
          <h2>Congratulations ${name}!</h2>
          <p>Your MingleMood profile has been approved!</p>
          <p>Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Complete Your Survey →
            </a>
          </p>
          <p>Once completed, we'll start sending you invites to exclusive events!</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailData);
}

// Custom email
export async function sendCustomEmail(email: string, subject: string, message: string, name: string): Promise<boolean> {
  const emailData = {
    to: email,
    subject: subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px;">
          <h1 style="color: white; margin: 0;">MingleMood</h1>
        </div>
        <div style="background: white; padding: 30px; margin-top: 20px;">
          <h2>Hi ${name}!</h2>
          ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
          <p style="margin-top: 30px;">
            <strong>The MingleMood Team</strong>
          </p>
        </div>
      </div>
    `,
    text: message
  };

  return await sendEmail(emailData);
}

// Email queue processing (placeholder)
export async function processEmailQueue(): Promise<void> {
  console.log('📧 Processing email queue...');
  // Email queue functionality can be added here
}
