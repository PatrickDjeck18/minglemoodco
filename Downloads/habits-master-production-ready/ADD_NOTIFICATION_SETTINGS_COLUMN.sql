-- Add notification_settings column to user_profiles table
-- Run this SQL in your Supabase SQL editor

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

-- Create RLS policies for notification_history
CREATE POLICY "Users can view own notification history" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification history" ON notification_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);
