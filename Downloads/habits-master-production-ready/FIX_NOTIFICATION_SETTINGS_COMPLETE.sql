-- Complete fix for notification settings errors
-- This SQL will create the necessary tables and columns to resolve notification settings errors

-- Step 0: Drop existing tables to recreate with correct column names
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;

-- Step 1: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add notification_preferences column to user_profiles table
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

-- Step 3: Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_profiles (with existence checks)
DO $$
BEGIN
  -- Drop existing policies first to avoid conflicts
  DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Users can upsert own profile" ON user_profiles;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_profiles;

  -- Create a single permissive policy for authenticated users
  CREATE POLICY "Enable all for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Step 5: Create reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  isRecurring BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 6: Create notification_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sentAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prayer_request_id UUID, -- Remove foreign key constraint to avoid dependency issues
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name TEXT,
  notification_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Enable RLS on reminders table
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for reminders (with existence checks)
DO $$
BEGIN
  -- Drop existing policies first
  DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
  DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON reminders;

  -- Create a single permissive policy for authenticated users
  CREATE POLICY "Enable all for authenticated users" ON reminders
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Step 9: Enable RLS on notification_history table
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for notification_history (with existence checks)
DO $$
BEGIN
  -- Drop existing policies first
  DROP POLICY IF EXISTS "Users can view own notification history" ON notification_history;
  DROP POLICY IF EXISTS "Users can insert own notification history" ON notification_history;
  DROP POLICY IF EXISTS "Enable all for authenticated users" ON notification_history;

  -- Create a single permissive policy for authenticated users
  CREATE POLICY "Enable all for authenticated users" ON notification_history
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Step 12: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_created_at ON reminders(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sentAt);

-- Step 13: Create a function to get or create user profile
CREATE OR REPLACE FUNCTION get_or_create_user_profile(p_user_id UUID)
RETURNS user_profiles AS $$
DECLARE
  profile user_profiles;
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile FROM user_profiles WHERE id = p_user_id;
  
  -- If no profile exists, create one with default settings
  IF NOT FOUND THEN
    INSERT INTO user_profiles (
      id,
      notification_preferences
    ) VALUES (
      p_user_id,
      '{
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
      }'::jsonb
    ) RETURNING * INTO profile;
  END IF;
  
  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13.5: Create a function to safely upsert user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_user_id UUID,
  p_notification_preferences JSONB
)
RETURNS user_profiles AS $$
DECLARE
  profile user_profiles;
BEGIN
  -- Try to update existing profile
  UPDATE user_profiles 
  SET 
    notification_preferences = p_notification_preferences,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO profile;
  
  -- If no profile was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO user_profiles (
      id,
      notification_preferences
    ) VALUES (
      p_user_id,
      p_notification_preferences
    ) RETURNING * INTO profile;
  END IF;
  
  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_profile TO authenticated;

-- Step 15: Drop existing view if it exists and create a new one
DROP VIEW IF EXISTS user_profiles_with_defaults;

-- Step 16: Create a view for easy access to user profiles with defaults
CREATE OR REPLACE VIEW user_profiles_with_defaults AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  COALESCE(notification_preferences, '{
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
  }'::jsonb) as notification_preferences,
  created_at,
  updated_at
FROM user_profiles;

-- Grant access to the view
GRANT SELECT ON user_profiles_with_defaults TO authenticated;
