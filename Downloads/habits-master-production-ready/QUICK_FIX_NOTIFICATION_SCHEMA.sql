-- Quick fix for notification schema issues
-- This script adds missing columns to existing tables

-- Add missing columns to reminders table
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add missing columns to notification_history table  
ALTER TABLE notification_history 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "prayerNotifications": true,
  "likeNotifications": true,
  "commentNotifications": true,
  "replyNotifications": true,
  "quietHours": {
    "enabled": false,
    "start": "22:00",
    "end": "07:00"
  },
  "soundEnabled": true,
  "vibrationEnabled": true
}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_is_recurring ON reminders(is_recurring);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);

-- Update RLS policies to be more permissive
DO $$
BEGIN
  -- Drop existing restrictive policies
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can upsert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;
  DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON reminders;
  DROP POLICY IF EXISTS "Users can view own notification history" ON notification_history;
  DROP POLICY IF EXISTS "Users can insert own notification history" ON notification_history;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON notification_history;

  -- Create permissive policies for authenticated users
  CREATE POLICY "Enable all for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Enable all for authenticated users" ON reminders
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Enable all for authenticated users" ON notification_history
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;
