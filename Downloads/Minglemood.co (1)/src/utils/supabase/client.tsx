import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Validate Supabase credentials
if (!projectId || !publicAnonKey) {
  console.error('❌ Supabase credentials missing!', { 
    hasProjectId: !!projectId, 
    hasPublicAnonKey: !!publicAnonKey 
  });
}

// Create a singleton Supabase client instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    try {
      if (!projectId || !publicAnonKey) {
        console.error('❌ Cannot create Supabase client - missing credentials');
        // Return a minimal client that won't crash the app
        return null as any;
      }

      supabaseInstance = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
          }
        }
      );
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      // Don't throw - return null to prevent app crash
      return null as any;
    }
  }
  return supabaseInstance;
};

// Export the singleton instance as default
export const supabase = getSupabaseClient();