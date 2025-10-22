# Database Schema Fix Guide

## Issues Found

1. **Missing `is_anonymous` column** in `prayer_requests` table
2. **Missing `notification_settings` column** in `user_profiles` table
3. **Missing `notification_history` table**

## Quick Fix: Run Database Migrations

### Step 1: Fix Prayer Requests Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add missing columns to prayer_requests table
ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

ALTER TABLE prayer_requests 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Update existing records
UPDATE prayer_requests SET is_anonymous = FALSE WHERE is_anonymous IS NULL;
UPDATE prayer_requests SET is_private = FALSE WHERE is_private IS NULL;
UPDATE prayer_requests SET is_public = TRUE WHERE is_public IS NULL;
UPDATE prayer_requests SET likes_count = 0 WHERE likes_count IS NULL;
UPDATE prayer_requests SET comments_count = 0 WHERE comments_count IS NULL;
UPDATE prayer_requests SET shares_count = 0 WHERE shares_count IS NULL;
```

### Step 2: Fix Notification Settings

Run this SQL in your Supabase SQL Editor:

```sql
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

-- Create notification_history table
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
```

### Step 3: Create Indexes for Performance

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_anonymous ON prayer_requests(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_private ON prayer_requests(is_private);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_category ON prayer_requests(category);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_public ON prayer_requests(is_public);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);
```

## Alternative: Use the Complete Migration Files

### Option 1: Use FIX_PRAYER_REQUESTS_SCHEMA.sql
Copy and paste the contents of `FIX_PRAYER_REQUESTS_SCHEMA.sql` into Supabase SQL Editor.

### Option 2: Use ADD_NOTIFICATION_SETTINGS_COLUMN.sql
Copy and paste the contents of `ADD_NOTIFICATION_SETTINGS_COLUMN.sql` into Supabase SQL Editor.

## Verification

After running the migrations, you should see:

1. **No more "column does not exist" errors**
2. **Prayer requests can be saved** with anonymous option
3. **Notification settings work** and persist
4. **Notification history is logged**

## Current Status

The app is designed to work with or without these database columns:

- ✅ **Prayer requests work** (with fallback for missing columns)
- ✅ **Notifications work** (with default settings)
- ✅ **No crashes** from missing columns
- ✅ **Graceful degradation** until migration is complete

## Troubleshooting

### If you still see errors:

1. **Check the exact column names** in your Supabase dashboard
2. **Verify the table structure** matches the expected schema
3. **Run the migrations step by step** instead of all at once
4. **Check for typos** in column names

### If migrations fail:

1. **Check if columns already exist** (some might be there)
2. **Run individual ALTER TABLE statements** one by one
3. **Check for permission issues** in Supabase
4. **Verify you're in the correct database**

The app will continue to work with graceful fallbacks until all migrations are complete!
