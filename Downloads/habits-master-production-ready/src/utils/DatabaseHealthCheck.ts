import { supabase } from './supabase';

export class DatabaseHealthCheck {
  /**
   * Check if all required tables exist in the database
   */
  static async checkDatabaseHealth(): Promise<{
    isHealthy: boolean;
    missingTables: string[];
    errors: string[];
  }> {
    const requiredTables = [
      'users',
      'user_profiles',
      'prayer_requests',
      'prayer_sessions',
      'practices',
      'practice_logs',
      'daily_devotions',
      'gratitude_entries',
      'fasting_records',
      'worship_sessions',
      'service_records',
      'christian_books',
      'christian_habit_templates',
      'christian_habits',
      'christian_habit_completions',
      'spiritual_milestones',
      'statistics'
    ];

    const missingTables: string[] = [];
    const errors: string[] = [];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist
            missingTables.push(table);
          } else {
            errors.push(`Error checking table ${table}: ${error.message}`);
          }
        }
      } catch (err) {
        errors.push(`Exception checking table ${table}: ${err}`);
      }
    }

    return {
      isHealthy: missingTables.length === 0 && errors.length === 0,
      missingTables,
      errors
    };
  }

  /**
   * Test basic database connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      return !error || error.code === 'PGRST116'; // Table might not exist but connection is good
    } catch (err) {
      console.error('Database connection test failed:', err);
      return false;
    }
  }

  /**
   * Get database setup instructions
   */
  static getSetupInstructions(): string {
    return `
Database Setup Required:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of src/utils/database-setup.sql
4. Run the SQL script to create all required tables
5. Verify tables are created in the Table Editor

If you continue to see 406 errors, the tables may not exist or RLS policies may be blocking access.
    `;
  }
}
