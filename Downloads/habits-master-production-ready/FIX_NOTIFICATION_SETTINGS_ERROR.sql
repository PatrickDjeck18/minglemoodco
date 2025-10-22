-- Fix notification_settings column error
-- This SQL will add the missing notification_settings column to user_profiles table
-- Run this in your Supabase SQL editor to resolve the error

-- First, check if user_profiles table exists, if not create it
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add notification_settings column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
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

-- Enable RLS on user_profiles table if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles if they don't exist
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON user_profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON user_profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create notification_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name TEXT,
  notification_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification_history table
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_history if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_history' 
    AND policyname = 'Users can view own notification history'
  ) THEN
    CREATE POLICY "Users can view own notification history" ON notification_history
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_history' 
    AND policyname = 'Users can insert own notification history'
  ) THEN
    CREATE POLICY "Users can insert own notification history" ON notification_history
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);

-- Update existing user profiles to have default notification settings
UPDATE user_profiles 
SET notification_settings = '{
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
WHERE notification_settings IS NULL;

-- Verify the fix
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'notification_settings';
