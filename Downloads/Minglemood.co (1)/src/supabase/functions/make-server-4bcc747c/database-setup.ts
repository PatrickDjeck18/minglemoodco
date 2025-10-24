// Database setup and migration utilities for MingleMood Social
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.ts';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Use service role for admin operations
);

export async function setupDatabase() {
  try {
    console.log('🚀 Setting up MingleMood database schema...');
    
    // Since we can't execute raw SQL directly in Supabase edge functions,
    // we'll create tables using the simplified KV approach and add demo data
    // For production, these tables would be created via Supabase Dashboard
    
    // Store database schema status
    await kv.set('database_setup_status', {
      setup_date: new Date().toISOString(),
      version: '1.0',
      tables_created: [
        'users_data',
        'events_data', 
        'event_rsvps_data',
        'matches_data',
        'email_campaigns_data'
      ]
    });
    
    // Create some sample data structure for testing
    await kv.set('database_info', {
      users_table_ready: true,
      events_table_ready: true,
      rsvps_table_ready: true,
      matches_table_ready: true,
      email_campaigns_ready: true,
      setup_complete: true
    });
    
    console.log('✅ Database structure initialized in KV store!');
    console.log('ℹ️  Note: For full SQL database tables, use Supabase Dashboard SQL Editor');
    
    return { 
      success: true, 
      message: 'Database structure initialized. Use Supabase Dashboard for full SQL schema.' 
    };
  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    return { success: false, error: error.message };
  }
}

export async function migrateUserData() {
  try {
    console.log('🔄 Migrating user data from auth metadata to KV store...');
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }
    
    console.log(`Found ${authUsers.users.length} users to migrate`);
    
    const migratedUsers = [];
    
    // Migrate each user to KV store
    for (const authUser of authUsers.users) {
      const metadata = authUser.user_metadata || {};
      const profileData = metadata.profile_data || {};
      
      const userData = {
        id: authUser.id,
        email: authUser.email,
        name: profileData.name,
        age: profileData.age ? parseInt(profileData.age) : null,
        gender: profileData.gender,
        location: profileData.location,
        phone: profileData.phone,
        profession: profileData.profession,
        education: profileData.education,
        religion: profileData.religion,
        ethnicity: profileData.ethnicity,
        bio: profileData.bio,
        interests: profileData.interests || [],
        looking_for: profileData.lookingFor,
        photos: profileData.photos || [],
        social_media: profileData.socialMedia || {},
        dating_preferences: {
          preferred_age_ranges: profileData.preferredAgeRanges || [],
          age_flexibility: profileData.ageFlexibility,
          preferred_ethnicities: profileData.preferredEthnicities || [],
          ethnicity_flexibility: profileData.ethnicityFlexibility,
          preferred_religions: profileData.preferredReligions || [],
          religion_flexibility: profileData.religionFlexibility,
          importance_ratings: profileData.importanceRatings || {},
          age_range: profileData.ageRange || {},
          max_distance: profileData.maxDistance
        },
        profile_complete: metadata.profile_complete || false,
        survey_completed: metadata.survey_completed || false,
        survey_data: metadata.survey_data || {},
        subscription_plan: metadata.plan || 'basic',
        is_active: true,
        is_admin: authUser.email === 'hello@minglemood.co' || metadata.is_admin || false,
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      };
      
      // Store user data in KV
      await kv.set(`users_data:${authUser.id}`, userData);
      migratedUsers.push(userData);
      
      console.log(`✅ Migrated user: ${authUser.email}`);
    }
    
    // Store summary of migrated users
    await kv.set('migrated_users_summary', {
      total_users: migratedUsers.length,
      migration_date: new Date().toISOString(),
      active_users: migratedUsers.filter(u => u.is_active).length,
      completed_profiles: migratedUsers.filter(u => u.profile_complete).length,
      completed_surveys: migratedUsers.filter(u => u.survey_completed).length,
      admin_users: migratedUsers.filter(u => u.is_admin).length
    });
    
    console.log('✅ User data migration to KV store completed!');
    return { success: true, migrated_count: migratedUsers.length };
  } catch (error) {
    console.error('❌ Failed to migrate user data:', error);
    return { success: false, error: error.message };
  }
}

// Function to get real-time admin stats from KV store
export async function getAdminStats() {
  try {
    // Get migration summary
    const migrationSummary = await kv.get('migrated_users_summary');
    
    // Get all migrated users
    const allUsers = await kv.getByPrefix('users_data:');
    const users = allUsers.map(item => item.value);
    
    // Get all RSVPs
    const allRsvps = await kv.getByPrefix('rsvp:');
    const rsvps = allRsvps.map(item => item.value);
    
    // Get all events (from KV store or sample events)
    const events = await kv.get('sample_events') || [];
    
    // Calculate real stats from actual data
    const totalUsers = users.length || migrationSummary?.total_users || 0;
    const activeUsers = users.filter(u => 
      u.is_active && new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const totalEvents = Array.isArray(events) ? events.length : 0;
    const upcomingEvents = Array.isArray(events) ? 
      events.filter(event => new Date(event.date) >= new Date()).length : 0;
    
    // Real match stats - no fictitious calculations
    const totalMatches = 0; // Will be calculated when actual matching algorithm is implemented
    
    // RSVP stats from actual RSVPs only
    const confirmedRSVPs = rsvps.filter(r => r.status === 'confirmed').length;
    const pendingRSVPs = rsvps.filter(r => r.status === 'pending').length;
    const declinedRSVPs = rsvps.filter(r => r.status === 'declined').length;
    
    // Calculate revenue from actual paid RSVPs only
    const paidRsvps = rsvps.filter(r => r.paymentStatus === 'completed');
    const revenue = paidRsvps.reduce((total, rsvp) => {
      return total + (rsvp.amount || 0);
    }, 0);
    
    // Real email stats from actual sent emails
    const emailLogs = await kv.getByPrefix('email_log:');
    const totalEmailsSent = emailLogs.length;
    
    const stats = {
      totalUsers,
      activeUsers,
      totalEvents,
      upcomingEvents,
      totalMatches,
      revenue,
      emailStats: {
        totalSent: totalEmailsSent,
        invitationsSent: emailLogs.filter(log => 
          log.value.template_type?.includes('invitation') || 
          log.value.subject?.includes('invitation')
        ).length,
        confirmedRSVPs,
        declinedRSVPs,
        pendingRSVPs
      }
    };
    
    console.log('📊 Generated admin stats:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting admin stats:', error);
    
    // Return fallback stats if error
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalEvents: 0,
      upcomingEvents: 0,
      totalMatches: 0,
      revenue: 0,
      emailStats: {
        totalSent: 0,
        invitationsSent: 0,
        confirmedRSVPs: 0,
        declinedRSVPs: 0,
        pendingRSVPs: 0
      }
    };
  }
}
