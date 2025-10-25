import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Helper function to set CORS headers
function setCorsHeaders(c: any) {
  const origin = c.req.header('Origin') || c.req.header('origin');
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'https://minglemood.co', 
    'https://www.minglemood.co'
  ];
  
  // Set CORS headers for all requests
  if (!origin || allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    c.header('Access-Control-Allow-Origin', '*');
  }
  
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '600');
}

// Custom CORS middleware for Supabase Edge Functions
app.use('*', async (c, next) => {
  // Always set CORS headers first
  setCorsHeaders(c);
  
  // Handle preflight requests - return 200 OK status
  if (c.req.method === 'OPTIONS') {
    console.log('🔄 OPTIONS preflight request received');
    return c.text('OK', 200);
  }
  
  // Check for oversized headers before processing
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.length > 2000) {
    console.warn('⚠️ Authorization header too large:', authHeader.length, 'characters');
    return c.json({ 
      error: 'Authorization header too large', 
      message: 'Please refresh your session and try again' 
    }, 431);
  }
  
  await next();
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

// Helper function to validate and get user from token
async function validateUser(authHeader: string | null) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '').trim();
  
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  
  try {
    const { data: { user }, error } = await anonSupabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Explicit OPTIONS handlers for CORS preflight
app.options('/make-server-4bcc747c/events', (c) => {
  console.log('🔄 OPTIONS preflight for events endpoint');
  return c.text('OK', 200);
});

app.options('/make-server-4bcc747c/bookings', (c) => {
  console.log('🔄 OPTIONS preflight for bookings endpoint');
  return c.text('OK', 200);
});

app.options('/make-server-4bcc747c/admin/*', (c) => {
  console.log('🔄 OPTIONS preflight for admin endpoints');
  return c.text('OK', 200);
});

app.options('/make-server-4bcc747c/admin/deactivated-profiles', (c) => {
  console.log('🔄 OPTIONS preflight for deactivated profiles endpoint');
  return c.text('OK', 200);
});

// Simple test endpoint - accessible without auth
app.get('/test', (c) => {
  console.log('🧪 Test endpoint called');
  
  // Always set CORS headers first
  setCorsHeaders(c);
  
  return c.json({
    status: 'ok',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint - accessible without auth
app.get('/health', (c) => {
  console.log('🏥 Health check endpoint called');
  
  // Always set CORS headers first
  setCorsHeaders(c);
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'MingleMood Server v2.0',
    cors: 'enabled',
    message: 'Server is running successfully!'
  });
});

// Legacy health endpoint for backward compatibility
app.get('/make-server-4bcc747c/health', (c) => {
  console.log('🏥 Legacy health check endpoint called');
  
  // Always set CORS headers first
  setCorsHeaders(c);
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'MingleMood Server v2.0',
    cors: 'enabled',
    message: 'Server is running successfully!'
  });
});

// Events endpoint - GET all events
app.get('/make-server-4bcc747c/events', async (c) => {
  try {
    console.log('📅 Events endpoint called');

    // Always set CORS headers first
    setCorsHeaders(c);

    // Get events from database
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      // Return sample events if database query fails
      const sampleEvents = [
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
          id: 'event- flowers2',
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
      return c.json(sampleEvents);
    }

    return c.json(events || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    setCorsHeaders(c);
    return c.json({ error: 'Failed to fetch events' }, 500);
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

    // Store RSVP in database
    const { data, error } = await supabase
      .from('rsvps')
      .insert([rsvpData])
      .select();

    if (error) {
      console.error('Error creating RSVP:', error);
      return c.json({ error: 'Failed to create RSVP', message: error.message }, 500);
    }

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

// Bookings endpoint - GET user's bookings
app.get('/make-server-4bcc747c/bookings', async (c) => {
  try {
    console.log('📋 Bookings endpoint called');

    // Always set CORS headers first
    setCorsHeaders(c);

    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user's RSVPs from database
    const { data: rsvps, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return c.json({ error: 'Failed to fetch bookings' }, 500);
    }

    return c.json(rsvps || []);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    setCorsHeaders(c);
    return c.json({ error: 'Failed to fetch bookings' }, 500);
  }
});

// Matches endpoint - GET user's matches
app.get('/make-server-4bcc747c/matches', async (c) => {
  try {
    console.log('💕 Matches endpoint called');

    // Get user ID from auth header
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user) {
      return c.json([], 200);
    }

    // Get user's matches from database
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      return c.json([], 200);
    }

    return c.json(matches || []);
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
    const user = await validateUser(authHeader);

    if (!user) {
      return c.json([], 200);
    }

    // Get user's conversations from database
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('userId', user.id)
      .order('lastMessageTime', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return c.json([], 200);
    }

    return c.json(conversations || []);
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
    const user = await validateUser(authHeader);

    if (!user) {
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

    // Get user's subscription data from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      // Return default subscription data
      return c.json({
        plan: 'basic',
        stats: {
          profileViews: 0,
          likes: 0,
          matches: 0,
          eventsAttended: 0,
          memberSince: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
      }, 200);
    }

    return c.json(subscription);
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
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get statistics from database
    const [
      { count: totalUsers },
      { count: totalEvents },
      { count: totalRSVPs },
      { count: totalMatches }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('rsvps').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true })
    ]);

    // Get upcoming events
    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('date', new Date().toISOString().split('T')[0]);

    // Get revenue from completed payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    const revenue = payments?.reduce((total, payment) => total + (payment.amount / 100), 0) || 0;

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: totalUsers || 0,
      totalEvents: totalEvents || 0,
      upcomingEvents: upcomingEvents || 0,
      totalMatches: totalMatches || 0,
      revenue: revenue
    };

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

    // Always set CORS headers first
    setCorsHeaders(c);

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get all users from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return c.json({ error: 'Failed to fetch users' }, 500);
    }

    return c.json(users || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    setCorsHeaders(c);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Admin events endpoint
app.get('/make-server-4bcc747c/admin/events', async (c) => {
  try {
    console.log('📅 Admin events endpoint called');

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get all events from database
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching admin events:', error);
      return c.json({ error: 'Failed to fetch events' }, 500);
    }

    return c.json(events || []);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Admin email logs endpoint
app.get('/make-server-4bcc747c/admin/email-logs', async (c) => {
  try {
    console.log('📧 Admin email logs endpoint called');

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get email logs from database
    const { data: emailLogs, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching email logs:', error);
      return c.json({ error: 'Failed to fetch email logs' }, 500);
    }

    return c.json(emailLogs || []);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return c.json({ error: 'Failed to fetch email logs' }, 500);
  }
});

// Admin deactivated profiles endpoint
app.get('/make-server-4bcc747c/admin/deactivated-profiles', async (c) => {
  try {
    console.log('🚫 Admin deactivated profiles endpoint called');

    // Always set CORS headers first
    setCorsHeaders(c);

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get deactivated profiles from database (users where is_active is false)
    const { data: deactivatedProfiles, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deactivated profiles:', error);
      return c.json({ error: 'Failed to fetch deactivated profiles' }, 500);
    }

    return c.json(deactivatedProfiles || []);
  } catch (error) {
    console.error('Error fetching deactivated profiles:', error);
    setCorsHeaders(c);
    return c.json({ error: 'Failed to fetch deactivated profiles' }, 500);
  }
});

// Create event endpoint - POST new event (admin only)
app.post('/make-server-4bcc747c/admin/events', async (c) => {
  try {
    console.log('📅 Create event endpoint called');

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const { title, description, date, time, location, price, maxAttendees, category } = body;

    // Create event data
    const eventData = {
      title,
      description,
      date,
      time,
      location,
      price: parseFloat(price),
      maxAttendees: parseInt(maxAttendees),
      currentAttendees: 0,
      category,
      organizer: 'MingleMood Social',
      featured: false,
      requiresRsvp: true,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    // Store event in database
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      return c.json({ error: 'Failed to create event', message: error.message }, 500);
    }

    return c.json(data[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event', message: error.message }, 500);
  }
});

// Send notification endpoint - POST notification (admin only)
app.post('/make-server-4bcc747c/admin/notifications', async (c) => {
  try {
    console.log('📧 Send notification endpoint called');

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const { type, subject, message, targetAudience } = body;

    // Store notification in database
    const notificationData = {
      type,
      subject,
      message,
      targetAudience,
      sentBy: user.id,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select();

    if (error) {
      console.error('Error sending notification:', error);
      return c.json({ error: 'Failed to send notification', message: error.message }, 500);
    }

    return c.json({ success: true, notification: data[0] });
  } catch (error) {
    console.error('Error sending notification:', error);
    return c.json({ error: 'Failed to send notification', message: error.message }, 500);
  }
});

// Signup endpoint - POST new user registration
app.post('/make-server-4bcc747c/signup', async (c) => {
  try {
    console.log('👤 Signup endpoint called');
    
    // Always set CORS headers first
    setCorsHeaders(c);
    
    const body = await c.req.json();
    const { email, password, name, phone, age, gender, location, profession, lookingFor } = body;

    // Validate required fields
    if (!email || !password || !name || !phone || !age || !gender || !location || !profession || !lookingFor) {
      return c.json({
        error: 'Missing required fields',
        message: 'Please fill in all required fields'
      }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for demo
      user_metadata: {
        name,
        phone,
        age: parseInt(age),
        gender,
        location,
        profession,
        lookingFor,
        profile_complete: true,
        profile_data: {
          name,
          phone,
          age: parseInt(age),
          gender,
          location,
          profession,
          lookingFor
        }
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return c.json({
        error: 'Failed to create user account',
        message: authError.message
      }, 400);
    }

    if (!authData.user) {
      return c.json({
        error: 'User creation failed',
        message: 'Failed to create user account'
      }, 500);
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email: authData.user.email,
      name,
      phone,
      age: parseInt(age),
      gender,
      location,
      profession,
      looking_for: lookingFor,
      profile_complete: true,
      subscription_plan: 'basic',
      is_active: true,
      created_at: new Date().toISOString(),
      profile_data: {
        name,
        phone,
        age: parseInt(age),
        gender,
        location,
        profession,
        lookingFor
      }
    };

    const { error: profileError } = await supabase
      .from('users')
      .insert([userProfile]);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Don't fail the signup if profile creation fails - user can complete profile later
      console.warn('⚠️ User profile creation failed, but auth user was created');
    }

    console.log('✅ User created successfully:', authData.user.email);

    return c.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        profile_complete: true
      }
    });

  } catch (error) {
    console.error('Error in signup endpoint:', error);
    return c.json({
      error: 'Internal server error',
      message: 'Failed to create account'
    }, 500);
  }
});

// Profile completion email trigger
app.post('/make-server-4bcc747c/profile-completed', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, email, name } = body;

    console.log('📧 Profile completion email triggered for:', email);

    // Store email log
    const emailLogData = {
      userId,
      email,
      type: 'profile_completed',
      subject: 'Welcome to MingleMood!',
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('email_logs')
      .insert([emailLogData]);

    if (error) {
      console.error('Error logging email:', error);
    }

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

    // Store email log
    const emailLogData = {
      userId,
      email,
      type: 'survey_completed',
      subject: 'Survey Completed - Thank You!',
      status: 'sent',
      sentAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('email_logs')
      .insert([emailLogData]);

    if (error) {
      console.error('Error logging email:', error);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error sending survey completion email:', error);
    return c.json({ error: 'Failed to send email' }, 500);
  }
});

// Migrate users endpoint - admin only
app.post('/make-server-4bcc747c/admin/migrate-users', async (c) => {
  try {
    console.log('🔄 Migrate users endpoint called');

    // Check authentication and admin status
    const authHeader = c.req.header('Authorization');
    const user = await validateUser(authHeader);

    if (!user || !isAdmin(user.email)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get all users from auth.users table
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching auth users:', error);
      return c.json({ error: 'Failed to fetch users' }, 500);
    }

    let migratedCount = 0;

    // Migrate each user to the users table
    for (const authUser of authUsers.users) {
      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.profile_data?.name || 'Profile Incomplete',
        profile_complete: authUser.user_metadata?.profile_complete || false,
        survey_completed: authUser.user_metadata?.survey_completed || false,
        subscription_plan: authUser.user_metadata?.plan || 'basic',
        is_active: authUser.email_confirmed_at ? true : false,
        created_at: authUser.created_at,
        profile_data: authUser.user_metadata?.profile_data || null
      };

      const { error: insertError } = await supabase
        .from('users')
        .upsert([userData], { onConflict: 'id' });

      if (!insertError) {
        migratedCount++;
      }
    }

    const result = {
      success: true,
      migrated_count: migratedCount,
      message: `Successfully migrated ${migratedCount} users`
    };

    return c.json(result);
  } catch (error) {
    console.error('Error migrating users:', error);
    return c.json({ error: 'Migration failed', message: error.message }, 500);
  }
});

// Serve the application
Deno.serve(app.fetch);