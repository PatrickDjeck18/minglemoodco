import * as kv from './kv_store.tsx';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: (name: string): EmailTemplate => ({
    subject: 'Welcome to MingleMood! 🎉',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to MingleMood</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Where meaningful connections begin</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Welcome to MingleMood, ${name}!</h2>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 20px;">
            Welcome to the community. Our curation team will review your profile within 10-14 days. Once approved, you will start receiving invitations to gathers curated exclusively for you.
          </p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #CDEDB2; padding: 20px; margin: 25px 0; border-radius: 6px;">
            <h3 style="color: #01180B; margin: 0 0 15px 0; font-size: 18px;">
              What's next:
            </h3>
            <ul style="color: #01180B; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Profile review (10-14 days)</li>
              <li>Please complete the personalized preference survey (mandatory for accurate matching)</li>
              <li>We will begin connecting you to exclusive events and activities with vetted Singles who match your preferences</li>
            </ul>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 20px 0;">
            Questions? Contact us at <a href="mailto:hello@minglemood.co" style="color: #FA7872; text-decoration: none;">hello@minglemood.co</a>
          </p>
          
          <p style="color: #01180B; line-height: 1.6; margin: 20px 0;">
            Not ready to mingle? <a href="{{unsubscribeLink}}" style="color: #FA7872; text-decoration: none;">{{unsubscribeLink}}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `Welcome to MingleMood, ${name}!

Welcome to the community. Our curation team will review your profile within 10-14 days. Once approved, you will start receiving invitations to gathers curated exclusively for you.

What's next:
- Profile review (10-14 days)
- Please complete the personalized preference survey (mandatory for accurate matching)
- We will begin connecting you to exclusive events and activities with vetted Singles who match your preferences

Questions? Contact us at hello@minglemood.co

Not ready to mingle? {{unsubscribeLink}}

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  PROFILE_APPROVED: (name: string, surveyLink: string): EmailTemplate => ({
    subject: '🎉 Your MingleMood profile has been approved!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to the community!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">The MingleMood Team</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Congratulations ${name}! Your MingleMood profile has been approved!</h2>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches and events.
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #BF94EA; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="color: #01180B; margin: 0 0 20px 0; line-height: 1.6;">
              Survey link:
            </p>
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Survey →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 25px 0;">
            Once we find eligible Singles that fit your preferences, we will begin to send you invites to exclusive small group events (8-30 people). Make sure to mark our emails as "safe" to prevent them from going to spam and check your dashboard for updates.
          </p>
          
          <p style="color: #01180B; line-height: 1.6; margin: 30px 0 0 0;">
            Looking forward to your first event.<br>
            <strong style="color: #01180B;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `Welcome to the community!
The MingleMood Team

Congratulations ${name}! Your MingleMood profile has been approved!

Next step: Complete your personalization survey (5 minutes) to help us find your perfect matches and events.

Survey link: ${surveyLink}

Once we find eligible Singles that fit your preferences, we will begin to send you invites to exclusive small group events (8-30 people). Make sure to mark our emails as "safe" to prevent them from going to spam and check your dashboard for updates.

Looking forward to your first event.
The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  EVENT_INVITATION: (name: string, eventTitle: string, eventDate: string, eventTime: string, eventLocation: string, rsvpLink: string): EmailTemplate => ({
    subject: `✨ You're invited: ${eventTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">You're Invited! ✨</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">An exclusive MingleMood event</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            You've been personally selected for this exclusive MingleMood event based on your preferences and profile.
          </p>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">${eventTitle}</h3>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; color: #374151;">
                <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">📅 Date:</span>
                <span>${eventDate}</span>
              </div>
              <div style="display: flex; align-items: center; color: #374151;">
                <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">🕐 Time:</span>
                <span>${eventTime}</span>
              </div>
              <div style="display: flex; align-items: center; color: #374151;">
                <span style="font-weight: 600; margin-right: 10px; min-width: 80px;">📍 Location:</span>
                <span>${eventLocation}</span>
              </div>
            </div>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 6px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⏰ RSVP Required</h3>
            <p style="color: #92400e; margin: 0; line-height: 1.6;">You have <strong>3 days</strong> to RSVP or your spot will be released to the waitlist.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${rsvpLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; margin-right: 15px;">
              RSVP Yes! 🎉
            </a>
            <a href="${rsvpLink}?response=no" style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Can't Make It
            </a>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin: 25px 0; font-size: 14px; text-align: center; font-style: italic;">
            This invitation is private and exclusive to you. Please don't share event details.
          </p>
          
          <p style="color: #6b7280; margin: 30px 0 0 0;">
            We can't wait to see you there!<br>
            <strong style="color: #1f2937;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `You're invited to ${eventTitle}!

Hi ${name},

You've been personally selected for this exclusive MingleMood event.

Event Details:
📅 Date: ${eventDate}
🕐 Time: ${eventTime}
📍 Location: ${eventLocation}

⏰ IMPORTANT: You have 3 days to RSVP or your spot will be released.

RSVP: ${rsvpLink}

This invitation is private and exclusive to you.

We can't wait to see you there!
The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  RSVP_REMINDER: (name: string, eventTitle: string, hoursLeft: number, rsvpLink: string): EmailTemplate => ({
    subject: `⏰ Reminder: RSVP for ${eventTitle} (${hoursLeft}h left)`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">⏰ RSVP Reminder</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Don't miss your exclusive invitation</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            This is a friendly reminder that you have <strong style="color: #dc2626;">${hoursLeft} hours left</strong> to RSVP for:
          </p>
          
          <div style="background: #fef2f2; border: 2px solid #f87171; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 24px;">${eventTitle}</h3>
            <p style="color: #991b1b; margin: 0; font-size: 18px; font-weight: 600;">
              ⏰ RSVP deadline: ${hoursLeft} hours remaining
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin: 25px 0;">
            After the deadline, your spot will be automatically released to other members on the waitlist. We'd hate for you to miss this exclusive opportunity!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${rsvpLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 18px; margin-right: 15px;">
              RSVP Now! 🎉
            </a>
            <a href="${rsvpLink}?response=no" style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Can't Make It
            </a>
          </div>
          
          <p style="color: #6b7280; margin: 30px 0 0 0;">
            Questions? Reply to this email.<br>
            <strong style="color: #1f2937;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `RSVP Reminder: ${eventTitle}

Hi ${name},

You have ${hoursLeft} hours left to RSVP for ${eventTitle}.

After the deadline, your spot will be released to the waitlist.

RSVP now: ${rsvpLink}

Questions? Reply to this email.

The MingleMood Team

© 2024 MingleMood. All rights reserved.
Contact: hello@minglemood.co`
  }),

  RSVP_REMINDER_FINAL: (name: string, eventTitle: string, rsvpLink: string): EmailTemplate => ({
    subject: 'Don\'t miss out. Your Invitation Expires Tomorrow.',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Don't miss out. Your Invitation Expires Tomorrow.</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            We handpicked an event for you based on your personal interests, relationship goals and lifestyle preferences.
          </p>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            This is a final reminder that the invitation to <strong>${eventTitle}</strong> expires in exactly 24 hours. After 24 hours, this spot will go to the next person on our waitlist.
          </p>
          
          <div style="background: #fef2f2; border: 2px solid #E53A29; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <h3 style="color: #E53A29; margin: 0 0 15px 0; font-size: 24px;">${eventTitle}</h3>
            <p style="color: #E53A29; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
              ⏰ Invitation expires in 24 hours
            </p>
            <a href="${rsvpLink}" style="display: inline-block; background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              RSVP Now - Don't Miss Out →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 30px 0 0 0;">
            <strong style="color: #01180B;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `Don't miss out. Your Invitation Expires Tomorrow.

Hi ${name},

We handpicked an event for you based on your personal interests, relationship goals and lifestyle preferences.

This is a final reminder that the invitation to ${eventTitle} expires in exactly 24 hours. After 24 hours, this spot will go to the next person on our waitlist.

RSVP now: ${rsvpLink}

The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  POST_EVENT_SURVEY: (name: string, eventTitle: string, surveyLink: string): EmailTemplate => ({
    subject: `How was ${eventTitle}? Share your experience! 💫`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">How was your experience? 💫</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Help us make the next event even better</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 25px;">
            We hope you had an amazing time at <strong>${eventTitle}</strong>! Your feedback is incredibly valuable in helping us create even better experiences.
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">📝 Quick 2-Minute Survey</h3>
            <p style="color: #1e40af; margin: 0 0 20px 0; line-height: 1.6;">
              Share your thoughts and help us improve future events
            </p>
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Take Survey →
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 6px;">
            <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🎁 Bonus</h3>
            <p style="color: #92400e; margin: 0; line-height: 1.6;">Completing the survey puts you on the priority list for our next exclusive event!</p>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin: 25px 0;">
            Did you make any great connections? We'd love to hear about it! Our post-event matching feature will be launching soon to help you reconnect with fellow attendees.
          </p>
          
          <p style="color: #6b7280; margin: 30px 0 0 0;">
            Thank you for being part of the MingleMood community!<br>
            <strong style="color: #1f2937;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `How was ${eventTitle}?

Hi ${name},

We hope you had an amazing time! Your feedback helps us create better experiences.

Please take our quick 2-minute survey: ${surveyLink}

Bonus: Completing the survey puts you on the priority list for our next event!

Did you make great connections? Our post-event matching feature launches soon.

Thank you for being part of MingleMood!
The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  SURVEY_REMINDER_3_DAY: (name: string, surveyLink: string): EmailTemplate => ({
    subject: '3 DAY SURVEY REMINDER - Complete Your Personalization Survey',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">3 DAY SURVEY REMINDER</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Complete Your Personalization Survey</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            We're excited to find you amazing matches! To make sure that we connect you with the right people and experiences, we need a bit more information about your preferences.
          </p>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            Your personalization survey is still waiting for you:
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #BF94EA; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Survey →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 25px 0;">
            This quick 5-minute survey helps us:
          </p>
          
          <ul style="color: #01180B; line-height: 1.8; margin: 25px 0; padding-left: 20px;">
            <li>Connect you with compatible members</li>
            <li>Recommend experiences you'll love based on what you like to do</li>
            <li>Understand your interests and goals</li>
          </ul>
          
          <p style="color: #01180B; line-height: 1.6; margin: 25px 0;">
            The sooner you complete it, the sooner we can start finding your perfect matches.
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #BF94EA; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="color: #01180B; margin: 0 0 15px 0; line-height: 1.6;">
              Complete your survey:
            </p>
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Take Survey Now →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 30px 0 0 0;">
            Looking forward to making great connections for you!<br>
            <strong style="color: #01180B;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `3 DAY SURVEY REMINDER
Complete Your Personalization Survey

Hi ${name},

We're excited to find you amazing matches! To make sure that we connect you with the right people and experiences, we need a bit more information about your preferences.

Your personalization survey is still waiting for you: ${surveyLink}

This quick 5-minute survey helps us:

Connect you with compatible members

Recommend experiences you'll love based on what you like to do

Understand your interests and goals

The sooner you complete it, the sooner we can start finding your perfect matches.

Complete your survey: ${surveyLink}

Looking forward to making great connections for you!
The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  }),

  SURVEY_REMINDER_7_DAY: (name: string, surveyLink: string): EmailTemplate => ({
    subject: '7 DAY SURVEY REMINDER - Don\'t Miss Out on Perfect Matches!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
        <div style="background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">7 DAY SURVEY REMINDER</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Don't Miss Out on Perfect Matches!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #01180B; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            We're excited to share some amazing events for you, but we need your preferences.
          </p>
          
          <p style="color: #01180B; line-height: 1.6; margin-bottom: 25px;">
            Your personalization survey is here:
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #E53A29; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Survey →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 25px 0;">
            Please complete your survey to unlock the full MingleMood experience. It'll only take 5 minutes.
          </p>
          
          <div style="background: #f0f9ff; border: 2px solid #E53A29; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <p style="color: #01180B; margin: 0 0 15px 0; line-height: 1.6;">
              Complete now:
            </p>
            <a href="${surveyLink}" style="display: inline-block; background: linear-gradient(135deg, #E53A29 0%, #FA7872 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Take Survey Now →
            </a>
          </div>
          
          <p style="color: #01180B; line-height: 1.6; margin: 30px 0 0 0;">
            Don't let perfect matches slip away.<br>
            <strong style="color: #01180B;">The MingleMood Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">© 2024 MingleMood. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">Visit us at <a href="https://minglemood.co" style="color: #FA7872; text-decoration: none;">minglemood.co</a></p>
          <p style="margin: 5px 0 0 0;">Contact: <a href="mailto:hello@minglemood.co" style="color: #8b5cf6; text-decoration: none;">hello@minglemood.co</a></p>
        </div>
      </div>
    `,
    text: `7 DAY SURVEY REMINDER
Don't Miss Out on Perfect Matches!

Hi ${name},

We're excited to share some amazing events for you, but we need your preferences.

Your personalization survey is here: ${surveyLink}

Please complete your survey to unlock the full MingleMood experience. It'll only take 5 minutes.

Complete now: ${surveyLink}

Don't let perfect matches slip away.
The MingleMood Team

© 2024 MingleMood. All rights reserved.
Visit us at https://minglemood.co
Contact: hello@minglemood.co`
  })
};

// Send email function
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const rawApiKey = Deno.env.get('RESEND_API_KEY');
    if (!rawApiKey) {
      console.warn('⚠️ RESEND_API_KEY environment variable not found');
      console.warn('💡 Email functionality is disabled. Get an API key from https://resend.com/api-keys');
      console.warn('ℹ️ User registration will continue without email notifications');
      return false;
    }

    // Trim and sanitize API key to remove any whitespace, newlines, or non-ASCII characters
    const apiKey = rawApiKey.trim().replace(/[^\x00-\x7F]/g, '');
    
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY contains only invalid characters');
      console.error('💡 The API key must contain only ASCII characters');
      return false;
    }

    // Validate API key format
    if (!apiKey.startsWith('re_')) {
      console.warn('⚠️ Invalid RESEND_API_KEY format - Should start with "re_"');
      console.warn('💡 Get a valid API key from https://resend.com/api-keys');
      console.warn('📋 Current key preview:', apiKey.substring(0, 10) + '...');
      console.warn('ℹ️ Email functionality is disabled. User registration will continue without email notifications');
      console.warn('');
      console.warn('🔧 TO FIX:');
      console.warn('  1. Go to https://resend.com (sign up if needed)');
      console.warn('  2. Create an API key (will start with "re_")');
      console.warn('  3. Verify your domain "minglemood.co" in Resend');
      console.warn('  4. Update RESEND_API_KEY environment variable with the new key');
      console.warn('');
      return false;
    }

    console.log('📧 Sending email to:', emailData.to);
    console.log('📧 Subject:', emailData.subject);
    console.log('📧 Using API key:', apiKey.substring(0, 10) + '...');
    console.log('📧 From:', 'MingleMood Social <hello@minglemood.co>');

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MingleMood Social <hello@minglemood.co>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Email sending failed - Status:', response.status);
      console.error('❌ Email error response:', errorData);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorData);
        console.error('❌ Parsed error:', errorJson);
        
        // Provide helpful error messages
        if (errorJson.message?.includes('API key is invalid') || errorJson.name === 'validation_error') {
          console.error('');
          console.error('🔑 API KEY ISSUE DETECTED:');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('The RESEND_API_KEY you provided is invalid or expired.');
          console.error('');
          console.error('✅ How to fix:');
          console.error('  1. Go to https://resend.com/api-keys');
          console.error('  2. Create a new API key');
          console.error('  3. Update RESEND_API_KEY secret with the new key');
          console.error('  4. Make sure it starts with "re_"');
          console.error('  5. Verify your domain at https://resend.com/domains');
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('');
        }
      } catch (parseError) {
        console.error('❌ Raw error:', errorData);
      }
      
      return false;
    }

    const result = await response.json();
    console.log('✅ Email sent successfully! ID:', result.id);
    
    // Log email in KV store for tracking
    try {
      await kv.set(`email:${result.id}`, {
        id: result.id,
        to: emailData.to,
        subject: emailData.subject,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });
      console.log('✅ Email logged in KV store');
    } catch (kvError) {
      console.error('❌ Failed to log email in KV store:', kvError);
      // Don't fail email send for logging error
    }

    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('❌ Error details:', error.message);
    return false;
  }
}

// Template helpers
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const template = EMAIL_TEMPLATES.WELCOME(name);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendProfileApprovedEmail(email: string, name: string): Promise<boolean> {
  // Create survey link that directs to the app with survey parameter
  const surveyLink = 'https://minglemood.co?survey=true';
  const template = EMAIL_TEMPLATES.PROFILE_APPROVED(name, surveyLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendEventInvitationEmail(
  email: string, 
  name: string, 
  eventTitle: string, 
  eventDate: string, 
  eventTime: string, 
  eventLocation: string, 
  eventId: string
): Promise<boolean> {
  const rsvpLink = `https://minglemood.co?event=${eventId}&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.EVENT_INVITATION(name, eventTitle, eventDate, eventTime, eventLocation, rsvpLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendRSVPReminderEmail(
  email: string, 
  name: string, 
  eventTitle: string, 
  hoursLeft: number, 
  eventId: string
): Promise<boolean> {
  const rsvpLink = `https://minglemood.co?event=${eventId}&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.RSVP_REMINDER(name, eventTitle, hoursLeft, rsvpLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendRSVPReminderFinalEmail(
  email: string, 
  name: string, 
  eventTitle: string, 
  eventId: string
): Promise<boolean> {
  const rsvpLink = `https://minglemood.co?event=${eventId}&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.RSVP_REMINDER_FINAL(name, eventTitle, rsvpLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendPostEventSurveyEmail(
  email: string, 
  name: string, 
  eventTitle: string, 
  eventId: string
): Promise<boolean> {
  const surveyLink = `https://minglemood.co?survey=true&event=${eventId}&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.POST_EVENT_SURVEY(name, eventTitle, surveyLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function send3DaySurveyReminderEmail(email: string, name: string): Promise<boolean> {
  const surveyLink = `https://minglemood.co?survey=true&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.SURVEY_REMINDER_3_DAY(name, surveyLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function send7DaySurveyReminderEmail(email: string, name: string): Promise<boolean> {
  const surveyLink = `https://minglemood.co?survey=true&email=${encodeURIComponent(email)}`;
  const template = EMAIL_TEMPLATES.SURVEY_REMINDER_7_DAY(name, surveyLink);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

export async function sendCustomEmail(
  email: string,
  subject: string,
  message: string,
  name?: string
): Promise<boolean> {
  const personalizedMessage = message.replace(/{{name}}/g, name || 'Member');
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafafa;">
      <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">MingleMood Social</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Exclusive club for curated connections</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="color: #01180B; line-height: 1.6; white-space: pre-wrap;">${personalizedMessage}</div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">
          <p>MingleMood Social - Connecting Hearts, Creating Memories</p>
          <p>Visit us at <a href="https://minglemood.co" style="color: #BF94EA; text-decoration: none;">minglemood.co</a></p>
        </div>
      </div>
    </div>
  `;
  
  const text = personalizedMessage.replace(/{{name}}/g, name || 'Member');
  
  return await sendEmail({
    to: email,
    subject,
    html,
    text
  });
}

// Email queue for batch processing
export async function queueEmail(emailType: string, recipientData: any, eventData?: any): Promise<void> {
  const queueKey = `email_queue:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  await kv.set(queueKey, {
    type: emailType,
    recipient: recipientData,
    event: eventData,
    scheduled_for: new Date().toISOString(),
    status: 'queued'
  });
}

// Process email queue (can be called by admin or scheduled function)
export async function processEmailQueue(): Promise<void> {
  try {
    const queuedEmails = await kv.getByPrefix('email_queue:');
    
    for (const email of queuedEmails) {
      if (email.status !== 'queued') continue;
      
      let success = false;
      
      switch (email.type) {
        case 'welcome':
          success = await sendWelcomeEmail(email.recipient.email, email.recipient.name);
          break;
        case 'profile_approved':
          success = await sendProfileApprovedEmail(email.recipient.email, email.recipient.name);
          break;
        case 'event_invitation':
          success = await sendEventInvitationEmail(
            email.recipient.email,
            email.recipient.name,
            email.event.title,
            email.event.date,
            email.event.time,
            email.event.location,
            email.event.id
          );
          break;
        case 'rsvp_reminder':
          success = await sendRSVPReminderEmail(
            email.recipient.email,
            email.recipient.name,
            email.event.title,
            email.event.hoursLeft,
            email.event.id
          );
          break;
        case 'rsvp_reminder_final':
          success = await sendRSVPReminderFinalEmail(
            email.recipient.email,
            email.recipient.name,
            email.event.title,
            email.event.id
          );
          break;
        case 'post_event_survey':
          success = await sendPostEventSurveyEmail(
            email.recipient.email,
            email.recipient.name,
            email.event.title,
            email.event.id
          );
          break;
        case 'survey_reminder_3_day':
          success = await send3DaySurveyReminderEmail(
            email.recipient.email,
            email.recipient.name
          );
          break;
        case 'survey_reminder_7_day':
          success = await send7DaySurveyReminderEmail(
            email.recipient.email,
            email.recipient.name
          );
          break;
      }
      
      // Update queue item status
      const queueKey = Object.keys(queuedEmails).find(key => queuedEmails[key] === email);
      if (queueKey) {
        await kv.set(queueKey, {
          ...email,
          status: success ? 'sent' : 'failed',
          processed_at: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error);
  }
}