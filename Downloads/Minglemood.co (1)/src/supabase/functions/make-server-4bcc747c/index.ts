import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.ts';
import * as emailService from './email-service.ts';
import { setupDatabase, migrateUserData, getAdminStats } from './database-setup.ts';

const app = new Hono();

// Middleware - CORS with explicit configuration
app.use('*', cors({
  origin: (origin) => {
    // Allow all origins including Figma preview domains
    return origin;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
  credentials: false, // Set to false when using wildcard origin
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

// Events endpoint - GET all events
app.get('/make-server-4bcc747c/events', async (c) => {
  try {
    console.log('📅 Events endpoint called');
    
    // Get events from KV store
    let events = await kv.get('sample_events');
    
    // If no events in KV, create some sample events
    if (!events || !Array.isArray(events) || events.length === 0) {
      events = [
        {
          id: 'event-1',
          title: 'Wine Tasting & Networking Evening',
          description: 'Join us for an elegant evening of wine tasting featuring boutique California wineries. Connect with like-minded professionals in an intimate setting.',
          date: '2025-11-15',
          time: '19:00',
          location: 'The Wine Loft, San Francisco',
          price: 85,
          maxAttendees: 30,
          currentAttendees: 12,
          category: 'Social',
          image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
          organizer: 'MingleMood Social',
          featured: true,
          requiresRsvp: true,
          cancellationPolicy: 'Full refund until 48 hours before event',
          dressCode: 'Smart Casual',
          ageRestriction: '28+',
          includesFood: true,
          includesDrinks: true
        },
        {
          id: 'event-2',
          title: 'Sunset Yacht Mixer',
          description: 'Experience the bay like never before on our exclusive sunset yacht party. Premium bar, gourmet appetizers, and spectacular views.',
          date: '2025-11-22',
          time: '18:30',
          location: 'Pier 39 Marina, San Francisco',
          price: 150,
          maxAttendees: 50,
          currentAttendees: 28,
          category: 'Premium',
          image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
          organizer: 'MingleMood Social',
          featured: true,
          requiresRsvp: true,
          cancellationPolicy: 'Full refund until 7 days before event',
          dressCode: 'Cocktail Attire',
          ageRestriction: '30+',
          includesFood: true,
          includesDrinks: true
        },
        {
          id: 'event-3',
          title: 'Art Gallery Opening & Cocktails',
          description: 'Private viewing of contemporary art followed by cocktails and conversation with artists and collectors.',
          date: '2025-11-08',
          time: '19:30',
          location: 'SFMOMA, San Francisco',
          price: 65,
          maxAttendees: 40,
          currentAttendees: 15,
          category: 'Cultural',
          image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
          organizer: 'MingleMood Social',
          featured: false,
          requiresRsvp: true,
          cancellationPolicy: 'Full refund until 24 hours before event',
          dressCode: 'Business Casual',
          ageRestriction: '25+',
          includesFood: true,
          includesDrinks: true
        }
      ];
      
      // Store for future use
      await kv.set('sample_events', events);
    }
    
    return c.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Bookings endpoint - GET user's bookings
app.get('/make-server-4bcc747c/bookings', async (c) => {
  try {
    console.log('📋 Bookings endpoint called');
    
    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Auth error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user's RSVPs
    const allRsvps = await kv.getByPrefix('rsvp:');
    const userRsvps = allRsvps
      .map(item => item.value)
      .filter(rsvp => rsvp.userId === user.id);
    
    return c.json(userRsvps);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return c.json([], 200); // Return empty array on error
  }
});

// RSVP endpoint - POST new RSVP
app.post('/make-server-4bcc747c/rsvp-event', async (c) => {
  try {
    console.log('✉️ RSVP endpoint called');
    
    const body = await c.req.json();
    const { eventId, userId, attendeeName, email, phone, dietaryRestrictions, emergencyContact, emergencyPhone, specialRequests, eventPrice } = body;
    
    // Generate RSVP ID
    const rsvpId = `rsvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create RSVP data
    const rsvpData = {
      id: rsvpId,
      eventId,
      userId,
      attendeeName,
      email,
      phone,
      dietaryRestrictions,
      emergencyContact,
      emergencyPhone,
      specialRequests,
      status: 'confirmed',
      paymentStatus: eventPrice > 0 ? 'pending' : 'completed',
      amount: eventPrice,
      ticketNumber: `MM-${Date.now().toString().substr(-6)}`,
      createdAt: new Date().toISOString()
    };
    
    // Store RSVP
    await kv.set(`rsvp:${rsvpId}`, rsvpData);
    
    // If event requires payment, return payment intent info
    if (eventPrice > 0) {
      return c.json({
        rsvpId,
        paymentRequired: true,
        clientSecret: `demo_secret_${rsvpId}`,
        amount: eventPrice
      });
    }
    
    return c.json({
      rsvpId,
      paymentRequired: false,
      ticketNumber: rsvpData.ticketNumber
    });
  } catch (error) {
    console.error('Error creating RSVP:', error);
    return c.json({ error: 'Failed to create RSVP', message: error.message }, 500);
  }
});

// Matches endpoint - GET user's matches
app.get('/make-server-4bcc747c/matches', async (c) => {
  try {
    console.log('💕 Matches endpoint called');
    
    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json([], 200); // Return empty array if not authenticated
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json([], 200);
    }
    
    // Get matches from KV store
    const allMatches = await kv.getByPrefix(`match:${user.id}:`);
    const matches = allMatches.map(item => item.value);
    
    return c.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return c.json([], 200);
  }
});

// Conversations endpoint - GET user's conversations
app.get('/make-server-4bcc747c/conversations', async (c) => {
  try {
    console.log('💬 Conversations endpoint called');
    
    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json([], 200);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json([], 200);
    }
    
    // Get conversations from KV store
    const allConversations = await kv.getByPrefix(`conversation:${user.id}:`);
    const conversations = allConversations.map(item => item.value);
    
    return c.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return c.json([], 200);
  }
});

// Subscription endpoint - GET user's subscription data
app.get('/make-server-4bcc747c/subscription', async (c) => {
  try {
    console.log('👑 Subscription endpoint called');
    
    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ 
        plan: 'basic',
        stats: {
          profileViews: 0,
          likes: 0,
          matches: 0,
          eventsAttended: 0,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
      }, 200);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user) {
      return c.json({ 
        plan: 'basic',
        stats: {
          profileViews: 0,
          likes: 0,
          matches: 0,
          eventsAttended: 0,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
      }, 200);
    }
    
    // Get user data from KV store
    const userData = await kv.get(`users_data:${user.id}`);
    
    // Get user's RSVPs to count events attended
    const allRsvps = await kv.getByPrefix('rsvp:');
    const userRsvps = allRsvps
      .map(item => item.value)
      .filter(rsvp => rsvp.userId === user.id && rsvp.status === 'confirmed');
    
    const plan = userData?.subscription_plan || user.user_metadata?.plan || 'basic';
    
    return c.json({
      plan,
      stats: {
        profileViews: userData?.stats?.profileViews || 0,
        likes: userData?.stats?.likes || 0,
        matches: userData?.stats?.matches || 0,
        eventsAttended: userRsvps.length,
        memberSince: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ 
      plan: 'basic',
      stats: {
        profileViews: 0,
        likes: 0,
        matches: 0,
        eventsAttended: 0,
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    }, 200);
  }
});

// Admin stats endpoint
app.get('/make-server-4bcc747c/admin/stats', async (c) => {
  try {
    console.log('📊 Admin stats endpoint called');
    
    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const stats = await getAdminStats();
    return c.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Admin users endpoint
app.get('/make-server-4bcc747c/admin/users', async (c) => {
  try {
    console.log('👥 Admin users endpoint called');
    
    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get all users from KV store
    const allUsers = await kv.getByPrefix('users_data:');
    const users = allUsers.map(item => item.value);
    
    return c.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json([], 200);
  }
});

// Admin events endpoint
app.get('/make-server-4bcc747c/admin/events', async (c) => {
  try {
    console.log('📅 Admin events endpoint called');
    
    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get events from KV store
    const events = await kv.get('sample_events') || [];
    return c.json(events);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    return c.json([], 200);
  }
});

// Admin email logs endpoint
app.get('/make-server-4bcc747c/admin/email-logs', async (c) => {
  try {
    console.log('📧 Admin email logs endpoint called');
    
    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Get email logs from KV store
    const allLogs = await kv.getByPrefix('email_log:');
    const emailLogs = allLogs.map(item => item.value);
    
    return c.json(emailLogs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return c.json([], 200);
  }
});

// Migrate users endpoint - admin only
app.post('/make-server-4bcc747c/admin/migrate-users', async (c) => {
  try {
    console.log('🔄 Migrate users endpoint called');
    
    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    
    if (error || !user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    const result = await migrateUserData();
    return c.json(result);
  } catch (error) {
    console.error('Error migrating users:', error);
    return c.json({ error: 'Migration failed', message: error.message }, 500);
  }
});

// Profile completion email trigger
app.post('/make-server-4bcc747c/profile-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name } = body;
    
    console.log('📧 Profile completion email triggered for:', email);
    
    // Send welcome email
    await emailService.sendEmail({
      to: email,
      subject: 'Welcome to MingleMood Social! Your Profile is Complete',
      html: `
        <h1>Welcome ${name}!</h1>
        <p>Your profile has been successfully created. We're excited to help you make meaningful connections!</p>
        <p>Next steps:</p>
        <ul>
          <li>Complete your preferences survey for better matches</li>
          <li>Browse upcoming exclusive events</li>
          <li>Start connecting with like-minded individuals</li>
        </ul>
      `
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending profile completion email:', error);
    return c.json({ error: 'Failed to send email' }, 500);
  }
});

// Survey completion notification
app.post('/make-server-4bcc747c/survey-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name } = body;
    
    console.log('📧 Survey completion email triggered for:', email);
    
    // Send confirmation email
    await emailService.sendEmail({
      to: email,
      subject: 'Survey Complete - Personalized Matching Active!',
      html: `
        <h1>Thanks ${name}!</h1>
        <p>Your preferences survey is complete. Our matching algorithm is now working to find your perfect matches!</p>
        <p>You'll start receiving personalized event invitations based on your preferences.</p>
      `
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending survey completion email:', error);
    return c.json({ error: 'Failed to send email' }, 500);
  }
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

Deno.serve(app.fetch);