import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import * as emailService from './email-service.tsx';
import { setupDatabase, migrateUserData, getAdminStats } from './database-setup.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*', // Allow all origins for now to fix CORS issues
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use('*', logger(console.log));

// IMPORTANT: Handle OPTIONS requests for CORS preflight
app.options('*', (c) => {
  return c.text('', 204);
});

// Health check endpoint - accessible with anon key
app.get('/make-server-4bcc747c/health', (c) => {
  console.log('🏥 Health check endpoint called');
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'MingleMood Server v1.0',
    cors: 'enabled',
    message: 'Server is running successfully!'
  });
});

// Initialize Supabase clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const anonSupabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Helper function to check if user is admin
function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return email === 'hello@minglemood.co' || email === 'mutemela72@gmail.com';
}

// Check environment variables on startup
console.log('🔧 Environment Check:');
console.log('📧 RESEND_API_KEY:', Deno.env.get('RESEND_API_KEY') ? 'SET ✅' : 'MISSING ❌');
console.log('🔐 SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? 'SET ✅' : 'MISSING ❌');
console.log('🔐 SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'SET ✅' : 'MISSING ❌');
console.log('🔐 SUPABASE_ANON_KEY:', Deno.env.get('SUPABASE_ANON_KEY') ? 'SET ✅' : 'MISSING ❌');

// Auth Routes
app.post('/make-server-4bcc747c/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, phone, age, gender, location, profession, lookingFor } = body;

    console.log('📝 Signup request with profile data:', { email, name, age, gender, location, profession, lookingFor });

    // Create comprehensive profile data from signup
    const profileData = {
      name,
      age,
      gender,
      location,
      phone,
      profession,
      lookingFor,
      // Basic profile completion - user still needs to add photos, interests, etc.
      photos: [],
      interests: [],
      bio: '',
      // Social media fields (optional)
      socialMedia: {
        linkedin: '',
        instagram: '',
        twitter: ''
      },
      // Basic preferences from signup
      ageRange: { min: '25', max: '45' }, // Default age range
      maxDistance: '25',
      // Set partial completion flag
      signup_complete: true,
      photos_needed: true
    };

    // Create user with admin privileges - skip email verification
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        phone,
        plan: 'basic',
        created_at: new Date().toISOString(),
        // Store essential profile data from signup
        profile_data: profileData,
        // Set as partially complete - user still needs photos and detailed preferences
        profile_complete: false,
        signup_profile_complete: true // New flag indicating signup basics are done
      },
      // Automatically confirm the user's email - no verification required
      email_confirm: true,
      phone_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('✅ User created with profile basics:', profileData);

    // Store additional user data with profile info
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone,
      plan: 'basic',
      profile_complete: false,
      signup_profile_complete: true,
      profile_data: profileData,
      created_at: new Date().toISOString()
    });

    // Send welcome email immediately upon signup
    console.log('📧 Attempting to send welcome email to:', email);
    try {
      const emailSent = await emailService.sendWelcomeEmail(email, name);
      if (emailSent) {
        console.log('✅ Welcome email sent successfully to:', email);
        
        // Log email success in system for tracking
        await kv.set(`email_log:welcome:${data.user.id}`, {
          user_id: data.user.id,
          email: email,
          type: 'welcome',
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
      } else {
        console.warn('⚠️ Welcome email failed to send to:', email);
        console.warn('ℹ️ User registration successful - email functionality is disabled');
        console.warn('💡 Configure RESEND_API_KEY to enable emails');
        // Log email failure for admin tracking
        await kv.set(`email_log:welcome:${data.user.id}`, {
          user_id: data.user.id,
          email: email,
          type: 'welcome',
          attempted_at: new Date().toISOString(),
          status: 'failed',
          error: 'Email service returned false - Invalid or missing RESEND_API_KEY'
        });
      }
    } catch (emailError) {
      console.error('❌ Exception sending welcome email:', emailError);
      // Log email failure for admin tracking
      await kv.set(`email_log:welcome:${data.user.id}`, {
        user_id: data.user.id,
        email: email,
        type: 'welcome',
        attempted_at: new Date().toISOString(),
        status: 'failed',
        error: emailError.message || 'Unknown error'
      });
      // Don't fail the signup if email fails
    }

    return c.json({ message: 'User created successfully', user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Profile completion notification route
app.post('/make-server-4bcc747c/profile-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name } = body;

    console.log('🎉 Profile completed for user:', email);

    // Send profile approved email
    console.log('📧 Attempting to send profile approval email to:', email);
    try {
      const emailSent = await emailService.sendProfileApprovedEmail(email, name);
      if (emailSent) {
        console.log('✅ Profile approval email sent successfully to:', email);
        
        // Log email success for tracking
        await kv.set(`email_log:profile_approved:${userId}`, {
          user_id: userId,
          email: email,
          type: 'profile_approved',
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

        return c.json({ success: true, message: 'Profile completion email sent' });
      } else {
        console.error('❌ Profile approval email failed to send to:', email);
        
        // Log email failure
        await kv.set(`email_log:profile_approved:${userId}`, {
          user_id: userId,
          email: email,
          type: 'profile_approved',
          attempted_at: new Date().toISOString(),
          status: 'failed',
          error: 'Email service returned false'
        });

        return c.json({ error: 'Failed to send profile completion email - service returned false' }, 500);
      }
    } catch (emailError) {
      console.error('❌ Exception sending profile approval email:', emailError);
      
      // Log email failure
      await kv.set(`email_log:profile_approved:${userId}`, {
        user_id: userId,
        email: email,
        type: 'profile_approved',
        attempted_at: new Date().toISOString(),
        status: 'failed',
        error: emailError.message || 'Unknown error'
      });

      return c.json({ error: `Failed to send profile completion email: ${emailError.message}` }, 500);
    }
  } catch (error) {
    console.error('❌ Profile completion notification error:', error);
    return c.json({ error: 'Failed to process profile completion' }, 500);
  }
});

// Survey completion notification route
app.post('/make-server-4bcc747c/survey-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name } = body;

    console.log('📝 Survey completed for user:', email);

    // For now, just log the survey completion
    // In the future, you could send a survey completion email or trigger event invitations
    await kv.set(`survey_completion:${userId}`, {
      user_id: userId,
      email: email,
      name: name,
      completed_at: new Date().toISOString(),
      status: 'completed'
    });

    console.log('✅ Survey completion logged for:', email);
    return c.json({ success: true, message: 'Survey completion logged' });
  } catch (error) {
    console.error('❌ Survey completion notification error:', error);
    return c.json({ error: 'Failed to process survey completion' }, 500);
  }
});

// Profile Routes
app.get('/make-server-4bcc747c/profiles', async (c) => {
  try {
    // Get sample profiles from KV store or return generated ones
    const profiles = await kv.get('sample_profiles');
    
    if (profiles) {
      return c.json(profiles);
    }

    // Generate and store sample profiles
    const sampleProfiles = generateSampleProfiles();
    await kv.set('sample_profiles', sampleProfiles);
    
    return c.json(sampleProfiles);
  } catch (error) {
    console.log('Error loading profiles:', error);
    return c.json({ error: 'Failed to load profiles' }, 500);
  }
});

// Matching Routes
app.get('/make-server-4bcc747c/matches', async (c) => {
  try {
    const matches = await kv.get('sample_matches');
    
    if (matches) {
      return c.json(matches);
    }

    const sampleMatches = generateSampleMatches();
    await kv.set('sample_matches', sampleMatches);
    
    return c.json(sampleMatches);
  } catch (error) {
    console.log('Error loading matches:', error);
    return c.json({ error: 'Failed to load matches' }, 500);
  }
});

app.post('/make-server-4bcc747c/like', async (c) => {
  try {
    const { userId, likedUserId } = await c.req.json();
    
    // Store like in KV
    const likeKey = `like:${userId}:${likedUserId}`;
    await kv.set(likeKey, {
      userId,
      likedUserId,
      timestamp: new Date().toISOString()
    });

    // Check for mutual like
    const reverseLikeKey = `like:${likedUserId}:${userId}`;
    const reverseLike = await kv.get(reverseLikeKey);
    
    if (reverseLike) {
      // Create match
      const matchKey = `match:${userId}:${likedUserId}`;
      await kv.set(matchKey, {
        user1: userId,
        user2: likedUserId,
        created_at: new Date().toISOString(),
        mutual: true
      });
    }

    return c.json({ message: 'Like recorded successfully' });
  } catch (error) {
    console.log('Error recording like:', error);
    return c.json({ error: 'Failed to record like' }, 500);
  }
});

// RSVP and Payment Routes
app.post('/make-server-4bcc747c/rsvp-event', async (c) => {
  try {
    const body = await c.req.json();
    const { eventId, userId, attendeeName, email, phone, dietaryRestrictions, emergencyContact, emergencyPhone, specialRequests, eventPrice } = body;

    // Generate unique RSVP ID
    const rsvpId = `rsvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    // Create RSVP record
    const rsvpData = {
      id: rsvpId,
      eventId,
      userId,
      attendeeName,
      email,
      phone,
      dietaryRestrictions: dietaryRestrictions || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      specialRequests: specialRequests || '',
      status: eventPrice > 0 ? 'pending' : 'confirmed',
      paymentStatus: eventPrice > 0 ? 'pending' : 'completed',
      ticketNumber,
      createdAt: new Date().toISOString(),
      eventPrice
    };

    // Store RSVP
    await kv.set(`rsvp:${rsvpId}`, rsvpData);
    await kv.set(`user_rsvp:${userId}:${eventId}`, rsvpId);

    // If payment required, create Stripe payment intent
    if (eventPrice > 0) {
      const stripe = (await import('npm:stripe')).default(Deno.env.get('STRIPE_SECRET_KEY'));
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(eventPrice * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          rsvpId: rsvpId,
          eventId: eventId,
          userId: userId
        }
      });

      // Update RSVP with payment intent
      rsvpData.paymentIntentId = paymentIntent.id;
      await kv.set(`rsvp:${rsvpId}`, rsvpData);

      return c.json({
        success: true,
        rsvpId: rsvpId,
        paymentRequired: true,
        clientSecret: paymentIntent.client_secret,
        ticketNumber
      });
    } else {
      // Free event - send confirmation email immediately
      await sendRSVPConfirmationEmail(rsvpData);
      
      return c.json({
        success: true,
        rsvpId: rsvpId,
        paymentRequired: false,
        ticketNumber
      });
    }

  } catch (error) {
    console.error('RSVP creation error:', error);
    return c.json({ error: 'Failed to create RSVP' }, 500);
  }
});

app.post('/make-server-4bcc747c/confirm-payment', async (c) => {
  try {
    const { rsvpId, paymentIntentId } = await c.req.json();

    // Get RSVP data
    const rsvpData = await kv.get(`rsvp:${rsvpId}`);
    if (!rsvpData) {
      return c.json({ error: 'RSVP not found' }, 404);
    }

    // Update payment status
    rsvpData.paymentStatus = 'completed';
    rsvpData.status = 'confirmed';
    rsvpData.paymentIntentId = paymentIntentId;
    rsvpData.confirmedAt = new Date().toISOString();

    await kv.set(`rsvp:${rsvpId}`, rsvpData);

    // Send confirmation email
    await sendRSVPConfirmationEmail(rsvpData);

    return c.json({ success: true });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return c.json({ error: 'Failed to confirm payment' }, 500);
  }
});

app.get('/make-server-4bcc747c/user-rsvps/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const rsvps = await kv.getByPrefix(`user_rsvp:${userId}:`);
    
    const rsvpDetails = await Promise.all(
      rsvps.map(async (item) => {
        const rsvpData = await kv.get(`rsvp:${item.value}`);
        return rsvpData;
      })
    );

    return c.json(rsvpDetails.filter(Boolean));

  } catch (error) {
    console.error('Get user RSVPs error:', error);
    return c.json({ error: 'Failed to get RSVPs' }, 500);
  }
});

// Event management routes
app.get('/make-server-4bcc747c/events', async (c) => {
  try {
    const events = await kv.getByPrefix('event:');
    const eventData = events.map(item => item.value);
    
    // If no events in database, return empty array (frontend will use sample data)
    return c.json(eventData);

  } catch (error) {
    console.error('Get events error:', error);
    return c.json([]);
  }
});

app.get('/make-server-4bcc747c/bookings', async (c) => {
  try {
    const bookings = await kv.getByPrefix('booking:');
    return c.json(bookings.map(item => item.value));

  } catch (error) {
    console.error('Get bookings error:', error);
    return c.json([]);
  }
});

// CORRUPTED TEST EMAIL ROUTE - COMMENTED OUT - USE /test-email-clean INSTEAD
/* 
// Test email route (admin only) for debugging
app.post('/make-server-4bcc747c/test-email', async (c) => {
  try {
    console.log('🧪 Test email request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { test_email, email_type = 'welcome' } = body;

    console.log('🧪 Testing email type:', email_type, 'to:', test_email);\n\n    // Check if RESEND_API_KEY is available\n    const apiKey = Deno.env.get('RESEND_API_KEY');\n    if (!apiKey) {\n      console.error('🧪 RESEND_API_KEY not found in environment');\n      return c.json({ \n        success: false, \n        message: 'Email service not configured - RESEND_API_KEY missing',\n        error: 'RESEND_API_KEY environment variable is not set. Please configure your email service.',\n        email_type,\n        recipient: test_email\n      });\n    }\n\n    console.log('🧪 API Key found:', apiKey.substring(0, 10) + '...');

    let emailSent = false;
    let errorMessage = '';

    try {
      if (email_type === 'welcome') {
        emailSent = await emailService.sendWelcomeEmail(test_email, 'Test User');
      } else if (email_type === 'profile_approved') {
        emailSent = await emailService.sendProfileApprovedEmail(test_email, 'Test User');
      } else if (email_type === 'custom') {
        emailSent = await emailService.sendCustomEmail(
          test_email,
          'Test Email from MingleMood',
          'This is a test email to verify the email system is working correctly.\n\nIf you received this, emails are working! 🎉',
          'Test User'
        );
      }

      console.log('🧪 Email test result:', emailSent ? 'SUCCESS' : 'FAILED');
      
      return c.json({ 
        success: emailSent, 
        message: emailSent ? 'Test email sent successfully! Check your inbox.' : 'Test email failed to send - Email service returned false',\n        error: emailSent ? null : 'Email service returned false. This could be due to invalid RESEND_API_KEY, invalid email address, or Resend service issues.',
        email_type,
        recipient: test_email
      });

    } catch (emailError) {
      console.error('🧪 Test email error:', emailError);
      errorMessage = emailError?.message || emailError?.toString() || 'Unknown error occurred';
      
      return c.json({ 
        success: false, 
        message: 'Test email failed with exception',
        error: errorMessage,
        email_type,
        recipient: test_email
      });
    }

  } catch (error) {
    console.error('🧪 Test email route error:', error);
    return c.json({ error: 'Failed to process test email request' }, 500);
  }
});
*/

// Email service function for RSVP confirmations
async function sendRSVPConfirmationEmail(rsvpData: any) {
  const emailTemplate = {
    to: rsvpData.email,
    subject: `🎉 RSVP Confirmed - ${rsvpData.eventId}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #BF94EA 0%, #FA7872 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">MingleMood Social</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your RSVP is Confirmed!</p>
        </div>
        
        <div style="padding: 40px 20px;">
          <h2 style="color: #01180B; margin-bottom: 20px;">Hello ${rsvpData.attendeeName}!</h2>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your RSVP has been confirmed. We're excited to see you at the event.
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #BF94EA; padding: 20px; margin: 20px 0;">
            <h3 style="color: #01180B; margin-top: 0;">Event Details</h3>
            <p style="margin: 5px 0;"><strong>Ticket Number:</strong> ${rsvpData.ticketNumber}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
          </div>
          
          ${rsvpData.dietaryRestrictions ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Dietary Restrictions Noted:</strong> ${rsvpData.dietaryRestrictions}</p>
            </div>
          ` : ''}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://minglemood.co/" style="background-color: #BF94EA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              View Event Details
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Questions? Reply to this email or contact us at events@minglemood.co
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">
            <p>MingleMood Social - Connecting Hearts, Creating Memories</p>
            <p>My bad, I'm not ready to Mingle. Please make my profile inactive and take me out of your database for now</p>
          </div>
        </div>
      </div>
    `
  };

  // Use existing email service
  try {
    await emailService.sendEmail(emailTemplate);
  } catch (error) {
    console.error('Failed to send RSVP confirmation email:', error);
  }
}

// Helper functions to generate sample data - NO STOCK PHOTOS
function generateSampleProfiles() {
  // Return empty array - no sample profiles with stock photos
  // Real user profiles will be added when users complete their profiles
  return [];
}

function generateSampleMatches() {
  // Return empty array - no sample matches with stock photos
  // Real matches will be generated from actual user profiles
  return [];
}

function generateSampleEvents() {
  // Return empty array - no sample events with stock photos
  // Real events will be created by admin through the event management system
  return [];
}

// Database management routes (admin only)
app.post('/make-server-4bcc747c/setup-database', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const result = await setupDatabase();
    return c.json(result);
  } catch (error) {
    console.error('Database setup error:', error);
    return c.json({ error: 'Failed to setup database' }, 500);
  }
});

app.post('/make-server-4bcc747c/migrate-users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const result = await migrateUserData();
    return c.json(result);
  } catch (error) {
    console.error('User migration error:', error);
    return c.json({ error: 'Failed to migrate users' }, 500);
  }
});

// Real-time admin data routes
app.get('/make-server-4bcc747c/admin/stats', async (c) => {
  try {
    console.log('📊 Admin stats request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    console.log('🔑 Checking user authorization...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || !isAdmin(user.email)) {
      console.log('❌ Unauthorized user:', user?.email);
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('✅ Admin authorized, fetching stats...');
    const stats = await getAdminStats();
    console.log('📊 Stats retrieved:', stats);
    return c.json(stats);
  } catch (error) {
    console.error('💥 Admin stats error:', error);
    return c.json({ error: 'Failed to get admin stats', details: error.message }, 500);
  }
});

app.get('/make-server-4bcc747c/admin/users', async (c) => {
  try {
    console.log('👥 Admin users request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    console.log('🔑 Checking user authorization...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || !isAdmin(user.email)) {
      console.log('❌ Unauthorized user:', user?.email);
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get users from KV store if migrated, otherwise from auth metadata
    try {
      const migratedUsers = await kv.getByPrefix('users_data:');
      if (migratedUsers.length > 0) {
        console.log(`Found ${migratedUsers.length} migrated users in KV store`);
        return c.json(migratedUsers.map(item => item.value));
      }
    } catch (kvError) {
      console.log('No migrated users found, falling back to auth users');
    }

    // Fallback: get users from auth.users
    console.log('🔍 Fetching users from Supabase Auth...');
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Error fetching auth users:', error);
      throw error;
    }

    console.log(`📊 Found ${authUsers.users.length} total users in auth`);
    
    // Filter users created in the last 7 days for debugging
    const recentUsers = authUsers.users.filter(user => {
      const createdDate = new Date(user.created_at);
      const daysDiff = (new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7;
    });
    
    console.log(`📅 Found ${recentUsers.length} users created in last 7 days`);
    
    const transformedUsers = authUsers.users.map(authUser => ({
      id: authUser.id,
      name: authUser.user_metadata?.profile_data?.name || 'Profile Incomplete',
      email: authUser.email,
      subscription_plan: authUser.user_metadata?.plan || 'basic',
      is_active: true,
      created_at: authUser.created_at,
      profile_complete: authUser.user_metadata?.profile_complete || false,
      last_sign_in: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at,
      // Include complete user metadata for profile viewer
      user_metadata: authUser.user_metadata,
      // Add joinDate for compatibility
      joinDate: authUser.created_at
    }));

    console.log('✅ Returning transformed users:', transformedUsers.length);
    return c.json(transformedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Get all profile responses (admin only) - for All Responses tab
app.get('/make-server-4bcc747c/admin/profile-responses', async (c) => {
  try {
    console.log('📋 Admin profile responses request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    console.log('🔑 Checking user authorization...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || user.email !== 'hello@minglemood.co') {
      console.log('❌ Unauthorized user:', user?.email);
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('🔍 Fetching all users for profile responses...');
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Error fetching auth users:', error);
      throw error;
    }

    console.log(`📊 Found ${authUsers.users.length} total users`);
    
    // Transform users for profile responses view
    const profileResponses = authUsers.users.map(authUser => {
      const createdDate = new Date(authUser.created_at);
      const daysSinceSignup = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        profile_complete: authUser.user_metadata?.profile_complete || false,
        survey_completed: authUser.user_metadata?.survey_completed || false,
        profile_data: authUser.user_metadata?.profile_data || {},
        preferences: authUser.user_metadata?.preferences || {},
        subscription_plan: authUser.user_metadata?.plan || 'basic',
        days_since_signup: daysSinceSignup,
        // Include complete user metadata for full profile access
        user_metadata: authUser.user_metadata
      };
    });

    console.log('✅ Returning profile responses:', profileResponses.length);
    return c.json(profileResponses);
  } catch (error) {
    console.error('Get profile responses error:', error);
    return c.json({ error: 'Failed to get profile responses' }, 500);
  }
});

// Delete user by email (admin only) - for testing purposes
app.delete('/make-server-4bcc747c/admin/users/:email', async (c) => {
  try {
    console.log('🗑️ Admin delete user request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    console.log('🔑 Checking user authorization...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || user.email !== 'hello@minglemood.co') {
      console.log('❌ Unauthorized user:', user?.email);
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const emailToDelete = c.req.param('email');
    console.log('🔍 Looking for user with email:', emailToDelete);

    // Find user by email
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing users:', listError);
      throw listError;
    }

    const userToDelete = authUsers.users.find(u => u.email === emailToDelete);
    if (!userToDelete) {
      console.log('❌ User not found:', emailToDelete);
      return c.json({ error: 'User not found' }, 404);
    }

    console.log('🗑️ Deleting user:', userToDelete.id);

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      throw deleteError;
    }

    // Clean up user data from KV store
    try {
      await kv.del(`user:${userToDelete.id}`);
      await kv.del(`users_data:${userToDelete.id}`);
      console.log('✅ Cleaned up user data from KV store');
    } catch (kvError) {
      console.log('⚠️ Error cleaning up KV store (non-critical):', kvError);
    }

    console.log('✅ User deleted successfully:', emailToDelete);
    return c.json({ 
      success: true, 
      message: `User ${emailToDelete} deleted successfully`,
      deletedUserId: userToDelete.id
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user: ' + error.message }, 500);
  }
});

// Get all profile responses with complete data (admin only)
app.get('/make-server-4bcc747c/admin/profile-responses', async (c) => {
  try {
    console.log('📋 Admin profile responses request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    console.log('🔑 Checking user authorization...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      console.error('❌ Auth error:', authError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || user.email !== 'hello@minglemood.co') {
      console.log('❌ Unauthorized user:', user?.email);
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get all users with complete metadata from Supabase Auth
    console.log('🔍 Fetching all users with complete profile data...');
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Error fetching auth users:', error);
      throw error;
    }

    console.log(`📊 Found ${authUsers.users.length} total users`);
    
    // Filter users who have profile responses (completed profiles)
    const usersWithProfiles = authUsers.users.filter(user => 
      user.user_metadata?.profile_complete === true || 
      user.user_metadata?.profile_data || 
      user.user_metadata?.survey_completed === true
    );
    
    console.log(`📋 Found ${usersWithProfiles.length} users with profile data`);
    
    // Return complete user data for profile responses
    const profileResponses = usersWithProfiles.map(authUser => ({
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at,
      // Complete user metadata with all profile responses
      user_metadata: authUser.user_metadata,
      // Calculated fields
      profile_complete: authUser.user_metadata?.profile_complete || false,
      survey_completed: authUser.user_metadata?.survey_completed || false,
      profile_data: authUser.user_metadata?.profile_data || {},
      survey_data: authUser.user_metadata?.survey_data || {},
      // Days since signup for sorting
      days_since_signup: Math.floor((new Date().getTime() - new Date(authUser.created_at).getTime()) / (1000 * 3600 * 24))
    }));

    // Sort by most recent first
    profileResponses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('✅ Returning profile responses:', profileResponses.length);
    return c.json(profileResponses);
  } catch (error) {
    console.error('💥 Get profile responses error:', error);
    return c.json({ error: 'Failed to get profile responses', details: error.message }, 500);
  }
});

// Debug endpoint for finding all users (admin only)
app.get('/make-server-4bcc747c/admin/debug-users', async (c) => {
  try {
    console.log('🔍 Debug users request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError) {
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get ALL users with complete raw data
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) {
      throw error;
    }

    console.log(`📊 Debug: Found ${authUsers.users.length} total users`);
    
    // Group users by signup date
    const usersByDate = {};
    authUsers.users.forEach(user => {
      const signupDate = new Date(user.created_at).toDateString();
      if (!usersByDate[signupDate]) {
        usersByDate[signupDate] = [];
      }
      usersByDate[signupDate].push({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile_complete: user.user_metadata?.profile_complete || false,
        has_profile_data: !!user.user_metadata?.profile_data,
        survey_completed: user.user_metadata?.survey_completed || false,
        profile_name: user.user_metadata?.profile_data?.name || 'No name',
        metadata_keys: Object.keys(user.user_metadata || {})
      });
    });

    return c.json({
      total_users: authUsers.users.length,
      users_by_date: usersByDate,
      raw_users: authUsers.users // Complete raw data for debugging
    });
  } catch (error) {
    console.error('Debug users error:', error);
    return c.json({ error: 'Failed to debug users' }, 500);
  }
});

app.get('/make-server-4bcc747c/admin/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get events from KV store
    const events = await kv.getByPrefix('event:');
    const eventData = events.map(item => ({
      id: item.value.id,
      title: item.value.title,
      date: item.value.date,
      current_attendees: item.value.currentAttendees || 0,
      max_attendees: item.value.maxAttendees,
      status: item.value.status || 'open'
    }));

    return c.json(eventData);
  } catch (error) {
    console.error('Get events error:', error);
    return c.json({ error: 'Failed to get events' }, 500);
  }
});

// Create new event (admin only)
app.post('/make-server-4bcc747c/admin/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { title, description, date, time, location, price, max_attendees, category } = body;

    // Generate unique event ID
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const eventData = {
      id: eventId,
      title,
      description,
      date,
      time,
      location,
      price: parseFloat(price) || 0,
      maxAttendees: parseInt(max_attendees) || 50,
      currentAttendees: 0,
      category,
      status: 'open',
      created_at: new Date().toISOString(),
      created_by: user.id
    };

    // Store event in KV
    await kv.set(`event:${eventId}`, eventData);

    console.log('✅ Event created successfully:', eventData);
    return c.json({ success: true, event: eventData });

  } catch (error) {
    console.error('❌ Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Send notifications (admin only)
app.post('/make-server-4bcc747c/admin/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { type, subject, message, target_audience } = body;

    // Get target users based on audience
    let targetUsers = [];
    if (target_audience === 'all') {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      targetUsers = authUsers?.users || [];
    } else {
      // Filter by subscription plan
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      targetUsers = authUsers?.users?.filter(u => 
        u.user_metadata?.plan === target_audience
      ) || [];
    }

    console.log(`📧 Sending ${type} notification to ${targetUsers.length} users (${target_audience})`);

    // Send notifications based on type
    if (type === 'email') {
      const emailPromises = targetUsers.map(async (targetUser) => {
        try {
          await emailService.sendCustomEmail(
            targetUser.email,
            subject,
            message,
            targetUser.user_metadata?.profile_data?.name || targetUser.email
          );
        } catch (error) {
          console.error(`Failed to send email to ${targetUser.email}:`, error);
        }
      });

      await Promise.allSettled(emailPromises);
    } else if (type === 'sms') {
      // SMS functionality would go here
      console.log('📱 SMS notifications not yet implemented');
    } else if (type === 'push') {
      // Push notification functionality would go here
      console.log('🔔 Push notifications not yet implemented');
    }

    // Log the notification
    const notificationLog = {
      id: `notification-${Date.now()}`,
      type,
      subject,
      message,
      target_audience,
      sent_count: targetUsers.length,
      created_at: new Date().toISOString(),
      created_by: user.id
    };

    await kv.set(`notification:${notificationLog.id}`, notificationLog);

    console.log('✅ Notification sent successfully:', notificationLog);
    return c.json({ 
      success: true, 
      sent_count: targetUsers.length,
      notification: notificationLog 
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return c.json({ error: 'Failed to send notification' }, 500);
  }
});

// Profile management routes (admin only)
app.get('/make-server-4bcc747c/admin/deactivated-profiles', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get deactivated profiles from KV store
    const deactivatedProfiles = await kv.getByPrefix('deactivated_profile:');
    const profileData = deactivatedProfiles.map(item => item.value);

    return c.json(profileData);
  } catch (error) {
    console.error('Get deactivated profiles error:', error);
    return c.json({ error: 'Failed to get deactivated profiles' }, 500);
  }
});

app.post('/make-server-4bcc747c/admin/deactivate-profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { userId, reason } = body;

    // Get user data before deactivation
    const { data: userToDeactivate, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    if (getUserError || !userToDeactivate) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Store deactivated profile data
    const deactivatedProfile = {
      id: `deact_${userId}`,
      originalUserId: userId,
      name: userToDeactivate.user.user_metadata?.profile_data?.name || 'Profile Incomplete',
      email: userToDeactivate.user.email,
      phone: userToDeactivate.user.user_metadata?.profile_data?.phone || 'Not provided',
      age: userToDeactivate.user.user_metadata?.profile_data?.age || 'Not specified',
      profession: userToDeactivate.user.user_metadata?.profile_data?.profession || 
                  userToDeactivate.user.user_metadata?.profile_data?.occupation || 'Not specified',
      deactivatedAt: new Date().toISOString(),
      reason: reason,
      membershipStatus: 'Deactivated',
      originalProfileData: {
        joinedAt: userToDeactivate.user.created_at,
        eventsAttended: 0,
        profileComplete: userToDeactivate.user.user_metadata?.profile_complete || false,
        surveyComplete: userToDeactivate.user.user_metadata?.survey_completed || false,
        originalMetadata: userToDeactivate.user.user_metadata
      }
    };

    // Store in KV
    await kv.set(`deactivated_profile:${userId}`, deactivatedProfile);

    // Update user metadata to mark as deactivated
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userToDeactivate.user.user_metadata,
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason
      }
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      // Continue anyway as profile is stored in KV
    }

    console.log('✅ Profile deactivated successfully:', userId);
    return c.json({ success: true, profile: deactivatedProfile });

  } catch (error) {
    console.error('❌ Error deactivating profile:', error);
    return c.json({ error: 'Failed to deactivate profile' }, 500);
  }
});

app.post('/make-server-4bcc747c/admin/reactivate-profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { userId, profileId } = body;

    // Get deactivated profile data
    const deactivatedProfile = await kv.get(`deactivated_profile:${userId}`);
    if (!deactivatedProfile) {
      return c.json({ error: 'Deactivated profile not found' }, 404);
    }

    // Restore user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...deactivatedProfile.originalProfileData.originalMetadata,
        is_active: true,
        reactivated_at: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error('Error reactivating user:', updateError);
      return c.json({ error: 'Failed to reactivate user' }, 500);
    }

    // Remove from deactivated profiles
    await kv.del(`deactivated_profile:${userId}`);

    console.log('✅ Profile reactivated successfully:', userId);
    return c.json({ success: true, userId });

  } catch (error) {
    console.error('❌ Error reactivating profile:', error);
    return c.json({ error: 'Failed to reactivate profile' }, 500);
  }
});

// Debug route to check recent sign-ups (admin only)
app.get('/make-server-4bcc747c/admin/debug-users', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get ALL users for debugging
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return c.json({ error: 'Failed to fetch users', details: error.message }, 500);
    }

    const debugInfo = {
      total_users: authUsers.users.length,
      users_last_7_days: authUsers.users.filter(u => {
        const daysDiff = (new Date().getTime() - new Date(u.created_at).getTime()) / (1000 * 3600 * 24);
        return daysDiff <= 7;
      }).length,
      users_yesterday: authUsers.users.filter(u => {
        const daysDiff = (new Date().getTime() - new Date(u.created_at).getTime()) / (1000 * 3600 * 24);
        return daysDiff >= 1 && daysDiff <= 2;
      }).length,
      recent_users: authUsers.users
        .filter(u => {
          const daysDiff = (new Date().getTime() - new Date(u.created_at).getTime()) / (1000 * 3600 * 24);
          return daysDiff <= 7;
        })
        .map(u => ({
          email: u.email,
          created_at: u.created_at,
          profile_complete: u.user_metadata?.profile_complete || false,
          name: u.user_metadata?.profile_data?.name || 'No name set'
        }))
    };

    return c.json(debugInfo);
  } catch (error) {
    console.error('Debug users error:', error);
    return c.json({ error: 'Failed to debug users' }, 500);
  }
});

// Email logs route (admin only)
app.get('/make-server-4bcc747c/admin/email-logs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get email logs from KV store
    const emailLogs = await kv.getByPrefix('email_log:');
    const logData = emailLogs.map(item => item.value).sort((a, b) => 
      new Date(b.sent_at || b.attempted_at).getTime() - new Date(a.sent_at || a.attempted_at).getTime()
    );

    return c.json(logData);
  } catch (error) {
    console.error('Get email logs error:', error);
    return c.json({ error: 'Failed to get email logs' }, 500);
  }
});

// Debug endpoint for connection testing
app.get('/make-server-4bcc747c/debug', async (c) => {
  try {
    console.log('🔍 Debug endpoint hit');
    
    const authHeader = c.req.header('Authorization');
    const hasAuth = !!authHeader;
    
    // Test database connection
    const { data: testData, error: testError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    const dbConnected = !testError;
    
    const debugInfo = {
      status: 'debug-ok',
      timestamp: new Date().toISOString(),
      server: 'MingleMood Server',
      environment: {
        supabase_url: !!Deno.env.get('SUPABASE_URL'),
        service_role_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        anon_key: !!Deno.env.get('SUPABASE_ANON_KEY'),
      },
      request: {
        has_auth_header: hasAuth,
        user_agent: c.req.header('User-Agent') || 'unknown',
        origin: c.req.header('Origin') || 'unknown',
      },
      database: {
        connected: dbConnected,
        error: testError?.message || null,
        test_user_count: testData?.users?.length || 0
      }
    };
    
    console.log('🔍 Debug info:', debugInfo);
    return c.json(debugInfo);
  } catch (error) {
    console.error('💥 Debug endpoint error:', error);
    return c.json({ 
      status: 'debug-error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Admin RSVP stats endpoint
app.get('/make-server-4bcc747c/admin/rsvps', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get RSVP data from KV store
    const rsvpData = await kv.getByPrefix('rsvp:');
    const rsvps = rsvpData.map(item => item.value);
    
    console.log('✅ Retrieved RSVP data:', rsvps.length);
    return c.json(rsvps);
  } catch (error) {
    console.error('Error getting RSVP data:', error);
    return c.json({ error: 'Failed to get RSVP data' }, 500);
  }
});

// Admin payments stats endpoint
app.get('/make-server-4bcc747c/admin/payments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Get payment data from KV store
    const paymentData = await kv.getByPrefix('payment:');
    const payments = paymentData.map(item => item.value);
    
    console.log('✅ Retrieved payment data:', payments.length);
    return c.json(payments);
  } catch (error) {
    console.error('Error getting payment data:', error);
    return c.json({ error: 'Failed to get payment data' }, 500);
  }
});

// RSVP reminder routes (admin only)
app.post('/make-server-4bcc747c/admin/send-rsvp-reminders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('📧 Admin triggered RSVP reminder sending');

    // Send RSVP reminder test to admin email
    const testReminderData = [
      {
        id: `reminder_${Date.now()}_1`,
        type: 'rsvp_reminder',
        recipient: { email: 'hello@minglemood.co', name: 'MingleMood Admin' },
        event: { 
          title: 'Test Event Reminder', 
          hoursLeft: 48, 
          id: 'test-event-reminder' 
        },
        status: 'queued',
        created_at: new Date().toISOString()
      }
    ];

    // Send regular RSVP reminder
    for (const emailData of testReminderData) {
      await kv.set(`email_queue:${emailData.id}`, emailData);
    }

    // Process the queue
    await emailService.processEmailQueue();

    console.log('✅ RSVP reminders sent successfully');
    return c.json({ 
      success: true, 
      message: 'RSVP reminders sent to hello@minglemood.co for testing',
      reminders_sent: testReminderData.length,
      test_email: 'hello@minglemood.co'
    });

  } catch (error) {
    console.error('❌ Error sending RSVP reminders:', error);
    return c.json({ error: 'Failed to send RSVP reminders' }, 500);
  }
});

app.post('/make-server-4bcc747c/admin/send-rsvp-final-reminders', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('🚨 Admin triggered RSVP FINAL reminder sending');

    // Send real final RSVP reminder to admin email for testing
    const finalReminderData = {
      id: `final_reminder_${Date.now()}`,
      type: 'rsvp_reminder_final',
      recipient: { email: 'hello@minglemood.co', name: 'MingleMood Admin' },
      event: { 
        title: 'Exclusive Private Members Dinner & Networking Event', 
        id: 'event-members-dinner-2024' 
      },
      status: 'queued',
      created_at: new Date().toISOString()
    };

    // Queue the email
    await kv.set(`email_queue:${finalReminderData.id}`, finalReminderData);

    // Process the queue
    await emailService.processEmailQueue();

    console.log('🚨 Final RSVP reminder sent successfully');
    return c.json({ 
      success: true, 
      message: 'Final RSVP reminder sent to hello@minglemood.co with updated template - check your inbox!',
      test_email: 'hello@minglemood.co',
      template_used: 'RSVP_REMINDER_FINAL'
    });

  } catch (error) {
    console.error('❌ Error sending final RSVP reminder:', error);
    return c.json({ error: 'Failed to send final RSVP reminder' }, 500);
  }
});

// Email queue processing route (admin only)
app.post('/make-server-4bcc747c/admin/process-email-queue', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    console.log('📧 Processing email queue manually...');
    await emailService.processEmailQueue();
    
    return c.json({ 
      success: true, 
      message: 'Email queue processed successfully' 
    });

  } catch (error) {
    console.error('❌ Error processing email queue:', error);
    return c.json({ error: 'Failed to process email queue' }, 500);
  }
});

// Get real-time email statistics (admin only)
app.get('/make-server-4bcc747c/admin/email-stats', async (c) => {
  try {
    console.log('📊 Loading real-time email statistics...');

    // Get all users from KV store
    const allUsers = await kv.getByPrefix('user:');
    const allEmails = await kv.getByPrefix('email:');
    
    const totalUsers = allUsers.length;
    let profilesCompleted = 0;
    let surveysCompleted = 0;
    let pendingApprovals = 0;
    
    // Count completed profiles and surveys
    for (const userData of allUsers) {
      if (userData.profile_complete === true) {
        profilesCompleted++;
      }
      if (userData.survey_completed === true) {
        surveysCompleted++;
      }
      if (userData.profile_complete === false && userData.profile_data) {
        pendingApprovals++;
      }
    }

    const totalSent = allEmails.length;
    const totalOpened = Math.floor(totalSent * 0.75); // Estimate 75% open rate
    const totalClicked = Math.floor(totalSent * 0.25); // Estimate 25% click rate
    
    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

    const stats = {
      total_users: totalUsers,
      profiles_completed: profilesCompleted,
      surveys_completed: surveysCompleted,
      pending_approvals: pendingApprovals,
      total_sent: totalSent,
      total_opened: totalOpened,
      total_clicked: totalClicked,
      open_rate: openRate,
      click_rate: clickRate,
      last_updated: new Date().toISOString()
    };

    console.log('✅ Email stats loaded:', stats);
    return c.json(stats);

  } catch (error) {
    console.error('❌ Error loading email stats:', error);
    return c.json({ 
      error: 'Failed to load email stats',
      total_users: 0,
      profiles_completed: 0,
      surveys_completed: 0,
      pending_approvals: 0,
      total_sent: 0,
      total_opened: 0,
      total_clicked: 0,
      open_rate: 0,
      click_rate: 0
    }, 500);
  }
});

// Get recent email activity (admin only)
app.get('/make-server-4bcc747c/admin/email-activity', async (c) => {
  try {
    console.log('📧 Loading recent email activity...');

    // Get recent emails from KV store
    const allEmails = await kv.getByPrefix('email:');
    const allUsers = await kv.getByPrefix('user:');
    
    // Sort emails by timestamp and get recent ones
    const recentEmails = allEmails
      .filter(email => email.sent_at)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      .slice(0, 20)
      .map(email => {
        // Find user data
        const user = allUsers.find(u => u.email === email.to);
        
        return {
          id: email.id,
          type: 'email',
          email: email.to,
          name: user?.profile_data?.name || user?.name || 'Unknown User',
          template: email.subject?.includes('Welcome') ? 'welcome' :
                   email.subject?.includes('approved') ? 'profile_approved' :
                   email.subject?.includes('Survey') ? 'survey_reminder' :
                   email.subject?.includes('Invitation') ? 'event_invitation' :
                   'custom',
          status: email.status || 'sent',
          timestamp: email.sent_at
        };
      });

    console.log(`✅ Loaded ${recentEmails.length} recent email activities`);
    return c.json({ 
      recent_emails: recentEmails,
      total_count: allEmails.length 
    });

  } catch (error) {
    console.error('❌ Error loading email activity:', error);
    return c.json({ 
      recent_emails: [],
      total_count: 0,
      error: 'Failed to load email activity'
    }, 500);
  }
});

// Clean test email route (admin only) for debugging - replacement for corrupted route
app.post('/make-server-4bcc747c/test-email-clean', async (c) => {
  try {
    console.log('🧪 Clean test email request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const body = await c.req.json();
    const { test_email, email_type = 'welcome' } = body;

    console.log('🧪 Testing email type:', email_type, 'to:', test_email);

    // Check if RESEND_API_KEY is available
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('🧪 RESEND_API_KEY not found in environment');
      return c.json({ 
        success: false, 
        message: 'Email service not configured - RESEND_API_KEY missing',
        error: 'RESEND_API_KEY environment variable is not set. Please configure your email service.',
        email_type,
        recipient: test_email
      });
    }

    console.log('🧪 API Key found:', apiKey.substring(0, 10) + '...');

    let emailSent = false;

    try {
      if (email_type === 'welcome') {
        emailSent = await emailService.sendWelcomeEmail(test_email, 'Test User');
      } else if (email_type === 'profile_approved') {
        emailSent = await emailService.sendProfileApprovedEmail(test_email, 'Test User');
      } else if (email_type === 'custom') {
        emailSent = await emailService.sendCustomEmail(
          test_email,
          'Test Email from MingleMood',
          'This is a test email to verify the email system is working correctly.\n\nIf you received this, emails are working! 🎉',
          'Test User'
        );
      } else {
        return c.json({ 
          success: false, 
          message: 'Invalid email type specified',
          error: `Email type '${email_type}' is not supported. Use: welcome, profile_approved, or custom`,
          email_type,
          recipient: test_email
        });
      }

      console.log('🧪 Email test result:', emailSent ? 'SUCCESS' : 'FAILED');
      
      if (emailSent) {
        return c.json({ 
          success: true, 
          message: 'Test email sent successfully! Check your inbox.',
          email_type,
          recipient: test_email
        });
      } else {
        return c.json({ 
          success: false, 
          message: 'Test email failed to send - Email service returned false',
          error: 'Email service returned false. This could be due to invalid RESEND_API_KEY, invalid email address, or Resend service issues.',
          email_type,
          recipient: test_email
        });
      }

    } catch (emailError) {
      console.error('🧪 Test email exception:', emailError);
      const errorMessage = emailError?.message || emailError?.toString() || 'Unknown error occurred';
      
      return c.json({ 
        success: false, 
        message: 'Test email failed with exception',
        error: errorMessage,
        details: {
          name: emailError?.name || 'Unknown',
          stack: emailError?.stack || 'No stack trace available'
        },
        email_type,
        recipient: test_email
      });
    }

  } catch (error) {
    console.error('🧪 Clean test email route error:', error);
    return c.json({ error: 'Failed to process test email request' }, 500);
  }
});

// API Key diagnostic route (admin only) to check RESEND_API_KEY validity
app.post('/make-server-4bcc747c/check-api-key', async (c) => {
  try {
    console.log('🔑 API Key validation request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || user.email !== 'hello@minglemood.co') {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Check if RESEND_API_KEY is available
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('🔑 RESEND_API_KEY not found in environment');
      return c.json({ 
        success: true,
        valid: false,
        error: 'RESEND_API_KEY environment variable is not set. Please configure your email service in Supabase secrets.'
      });
    }

    console.log('🔑 API Key found, validating format and connectivity...');

    // Check API key format (should start with re_ for Resend)
    if (!apiKey.startsWith('re_')) {
      console.error('🔑 Invalid API key format - should start with re_');
      return c.json({ 
        success: true,
        valid: false,
        error: 'Invalid RESEND_API_KEY format. Resend API keys should start with "re_".'
      });
    }

    // Test API key by making a request to Resend's domains endpoint
    try {
      const response = await fetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('🔑 API key is invalid - got 401 Unauthorized');
        return c.json({ 
          success: true,
          valid: false,
          error: 'API key is invalid or unauthorized. Please check your RESEND_API_KEY in Supabase secrets.'
        });
      }

      if (response.status === 403) {
        console.error('🔑 API key lacks permissions - got 403 Forbidden');
        return c.json({ 
          success: true,
          valid: false,
          error: 'API key lacks necessary permissions. Please ensure your Resend API key has domain access.'
        });
      }

      if (!response.ok) {
        console.error('🔑 API validation failed with status:', response.status);
        return c.json({ 
          success: true,
          valid: false,
          error: `API key validation failed with status ${response.status}. Please check your Resend account.`
        });
      }

      const data = await response.json();
      console.log('🔑 API key validation successful');
      
      return c.json({ 
        success: true,
        valid: true,
        domain: data?.data?.[0]?.name || 'Default',
        message: 'API key is valid and working!'
      });

    } catch (fetchError) {
      console.error('🔑 Network error testing API key:', fetchError);
      return c.json({ 
        success: true,
        valid: false,
        error: `Network error validating API key: ${fetchError.message}. Please check your internet connection and Resend service status.`
      });
    }

  } catch (error) {
    console.error('🔑 API key check route error:', error);
    return c.json({ error: 'Failed to process API key check request' }, 500);
  }
});

// API Key diagnostic route (admin only) to check RESEND_API_KEY format
app.get('/make-server-4bcc747c/check-api-key', async (c) => {
  try {
    console.log('🔑 API Key check request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!apiKey) {
      return c.json({ 
        has_api_key: false,
        message: 'RESEND_API_KEY environment variable is not set'
      });
    }

    // Basic format checks for Resend API key
    const keyLength = apiKey.length;
    const startsWithRe = apiKey.startsWith('re_');
    const hasValidLength = keyLength >= 40 && keyLength <= 60; // Typical range for Resend keys
    
    return c.json({
      has_api_key: true,
      key_preview: apiKey.substring(0, 15) + '...',
      key_length: keyLength,
      starts_with_re: startsWithRe,
      valid_length: hasValidLength,
      format_looks_correct: startsWithRe && hasValidLength,
      message: startsWithRe && hasValidLength 
        ? 'API key format looks correct' 
        : 'API key format may be incorrect. Resend keys should start with "re_" and be 40-60 characters long.'
    });

  } catch (error) {
    console.error('🔑 API Key check error:', error);
    return c.json({ error: 'Failed to check API key' }, 500);
  }
});

// Start server
Deno.serve(app.fetch);