-- Supabase Database Schema for Habits Master App
-- Run this SQL in your Supabase SQL editor to create the necessary tables

-- Enable Row Level Security (RLS)
ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_backup TIMESTAMP WITH TIME ZONE
);

-- Prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  prayer_count INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT FALSE,
  answered_date TIMESTAMP WITH TIME ZONE,
  testimony TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Prayer sessions table
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in seconds
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Prayer sessions table
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in minutes
  topic TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practices table
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  streak INTEGER DEFAULT 0,
  last_completed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Practice logs table
CREATE TABLE IF NOT EXISTS practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);


-- Statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  prayer_time INTEGER DEFAULT 0, -- in minutes
  reading_time INTEGER DEFAULT 0, -- in minutes
  practices_completed INTEGER DEFAULT 0,
  verses_mastered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_created_at ON prayer_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_practices_user_id ON practices(user_id);
CREATE INDEX IF NOT EXISTS idx_practices_is_active ON practices(is_active);

-- Row Level Security (RLS) Policies
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayer requests" ON prayer_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer requests" ON prayer_requests FOR DELETE USING (auth.uid() = user_id);


CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prayer sessions" ON prayer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayer sessions" ON prayer_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer sessions" ON prayer_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own practices" ON practices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practices" ON practices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own practices" ON practices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own practices" ON practices FOR DELETE USING (auth.uid() = user_id);


CREATE POLICY "Users can view own practice logs" ON practice_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own practice logs" ON practice_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can view own statistics" ON statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own statistics" ON statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own statistics" ON statistics FOR UPDATE USING (auth.uid() = user_id);

-- Functions for incrementing counters
CREATE OR REPLACE FUNCTION increment_prayer_count(request_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET prayer_count = prayer_count + 1 
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment values
CREATE OR REPLACE FUNCTION increment(value INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN value;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Add category column to prayer_requests if it doesn't exist
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS category TEXT;

-- Add social media features to prayer_requests
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Comments table for prayer requests
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer likes table
CREATE TABLE IF NOT EXISTS prayer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- Comment likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Prayer shares table
CREATE TABLE IF NOT EXISTS prayer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prayer_comments
CREATE POLICY "Users can view public prayer comments" ON prayer_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM prayer_requests 
    WHERE prayer_requests.id = prayer_comments.prayer_request_id 
    AND prayer_requests.is_public = true
  )
);
CREATE POLICY "Users can insert own prayer comments" ON prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayer comments" ON prayer_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer comments" ON prayer_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prayer_likes
CREATE POLICY "Users can view prayer likes" ON prayer_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own prayer likes" ON prayer_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer likes" ON prayer_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Users can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for prayer_shares
CREATE POLICY "Users can view prayer shares" ON prayer_shares FOR SELECT USING (true);
CREATE POLICY "Users can insert own prayer shares" ON prayer_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer shares" ON prayer_shares FOR DELETE USING (auth.uid() = user_id);

-- Functions for social features
CREATE OR REPLACE FUNCTION increment_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = likes_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = comments_count + 1 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count(prayer_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET comments_count = GREATEST(comments_count - 1, 0) 
  WHERE id = prayer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add is_anonymous column to existing prayer_requests table
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Christian Habits Enhancement Tables

-- Daily devotions table
CREATE TABLE IF NOT EXISTS daily_devotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scripture_reference TEXT,
  scripture_text TEXT,
  devotion_text TEXT NOT NULL,
  reflection_questions TEXT[],
  prayer_points TEXT[],
  date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fasting records table
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'water', 'food', 'social_media', 'entertainment', 'custom'
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  purpose TEXT,
  prayer_focus TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worship sessions table
CREATE TABLE IF NOT EXISTS worship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'personal', 'corporate', 'online', 'small_group'
  duration_minutes INTEGER NOT NULL,
  songs TEXT[],
  scripture_focus TEXT,
  notes TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gratitude journal table
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  entries TEXT[] NOT NULL,
  prayer_of_thanksgiving TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service/ministry records table
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'volunteer', 'ministry', 'outreach', 'mission', 'community_service'
  organization TEXT,
  activity TEXT NOT NULL,
  duration_hours DECIMAL(4,2),
  date DATE NOT NULL,
  description TEXT,
  impact_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian book reading progress
CREATE TABLE IF NOT EXISTS christian_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT, -- 'theology', 'devotional', 'biography', 'apologetics', 'spiritual_growth'
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  status TEXT DEFAULT 'reading', -- 'reading', 'completed', 'paused', 'planning'
  start_date DATE,
  completion_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian habits templates
CREATE TABLE IF NOT EXISTS christian_habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'prayer', 'study', 'worship', 'service', 'fellowship', 'discipline'
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  suggested_duration INTEGER, -- in minutes
  scripture_reference TEXT,
  benefits TEXT[],
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Christian habit templates
INSERT INTO christian_habit_templates (name, description, category, frequency, suggested_duration, scripture_reference, benefits, is_default) VALUES
('Morning Prayer', 'Start each day with prayer and thanksgiving', 'prayer', 'daily', 15, 'Psalm 5:3', ARRAY['Peaceful start to day', 'Better focus', 'Spiritual strength'], true),
('Bible Study', 'Daily scripture reading and meditation', 'study', 'daily', 30, 'Psalm 119:105', ARRAY['Spiritual growth', 'Wisdom', 'Guidance'], true),
('Evening Reflection', 'End day with gratitude and prayer', 'prayer', 'daily', 10, 'Psalm 4:8', ARRAY['Better sleep', 'Gratitude', 'Peace'], true),
('Weekly Fasting', 'Regular fasting for spiritual discipline', 'discipline', 'weekly', 1440, 'Matthew 6:16-18', ARRAY['Spiritual clarity', 'Self-control', 'Deeper prayer'], true),
('Worship Time', 'Personal worship and praise', 'worship', 'daily', 20, 'Psalm 100:2', ARRAY['Joy', 'Connection with God', 'Spiritual renewal'], true),
('Gratitude Journal', 'Daily gratitude practice', 'prayer', 'daily', 5, '1 Thessalonians 5:18', ARRAY['Positive mindset', 'Thankfulness', 'Joy'], true),
('Scripture Memory', 'Memorize and meditate on verses', 'study', 'daily', 15, 'Psalm 119:11', ARRAY['Spiritual armor', 'Wisdom', 'Comfort'], true),
('Service/Volunteer', 'Regular service to others', 'service', 'weekly', 120, 'Matthew 25:40', ARRAY['Purpose', 'Love in action', 'Community'], true),
('Fellowship', 'Connect with other believers', 'fellowship', 'weekly', 60, 'Hebrews 10:25', ARRAY['Encouragement', 'Accountability', 'Community'], true),
('Silence and Solitude', 'Quiet time with God', 'prayer', 'weekly', 30, 'Psalm 46:10', ARRAY['Hearing God', 'Peace', 'Spiritual renewal'], true);

-- Christian habits user instances
CREATE TABLE IF NOT EXISTS christian_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES christian_habit_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  target_duration INTEGER, -- in minutes
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_time TIME,
  reminder_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Sunday, 7=Saturday
  start_date DATE DEFAULT CURRENT_DATE,
  last_completed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian habit completions
CREATE TABLE IF NOT EXISTS christian_habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES christian_habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT,
  scripture_reference TEXT,
  prayer_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spiritual milestones
CREATE TABLE IF NOT EXISTS spiritual_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'achievement', 'breakthrough', 'testimony', 'goal'
  date_achieved DATE NOT NULL,
  scripture_reference TEXT,
  testimony TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE daily_devotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view own daily devotions" ON daily_devotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily devotions" ON daily_devotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily devotions" ON daily_devotions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily devotions" ON daily_devotions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fasting records" ON fasting_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fasting records" ON fasting_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fasting records" ON fasting_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fasting records" ON fasting_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own worship sessions" ON worship_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own worship sessions" ON worship_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own worship sessions" ON worship_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own worship sessions" ON worship_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own gratitude entries" ON gratitude_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gratitude entries" ON gratitude_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gratitude entries" ON gratitude_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gratitude entries" ON gratitude_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own service records" ON service_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service records" ON service_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service records" ON service_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service records" ON service_records FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own christian books" ON christian_books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own christian books" ON christian_books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own christian books" ON christian_books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own christian books" ON christian_books FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view christian habit templates" ON christian_habit_templates FOR SELECT USING (true);
CREATE POLICY "Users can view own christian habits" ON christian_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own christian habits" ON christian_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own christian habits" ON christian_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own christian habits" ON christian_habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own habit completions" ON christian_habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit completions" ON christian_habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit completions" ON christian_habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit completions" ON christian_habit_completions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spiritual milestones" ON spiritual_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public spiritual milestones" ON spiritual_milestones FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own spiritual milestones" ON spiritual_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spiritual milestones" ON spiritual_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spiritual milestones" ON spiritual_milestones FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_devotions_user_id ON daily_devotions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_devotions_date ON daily_devotions(date);
CREATE INDEX IF NOT EXISTS idx_fasting_records_user_id ON fasting_records(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_records_start_time ON fasting_records(start_time);
CREATE INDEX IF NOT EXISTS idx_worship_sessions_user_id ON worship_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON gratitude_entries(date);
CREATE INDEX IF NOT EXISTS idx_service_records_user_id ON service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(date);
CREATE INDEX IF NOT EXISTS idx_christian_books_user_id ON christian_books(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_books_status ON christian_books(status);
CREATE INDEX IF NOT EXISTS idx_christian_habits_user_id ON christian_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_habits_is_active ON christian_habits(is_active);
CREATE INDEX IF NOT EXISTS idx_christian_habit_completions_habit_id ON christian_habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_christian_habit_completions_completed_at ON christian_habit_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_user_id ON spiritual_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_date ON spiritual_milestones(date_achieved);

-- Functions for Christian habits
CREATE OR REPLACE FUNCTION update_habit_streak(habit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE christian_habits 
  SET 
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    total_completions = total_completions + 1,
    last_completed = NOW()
  WHERE id = habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_habit_streak(habit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE christian_habits 
  SET current_streak = 0
  WHERE id = habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;