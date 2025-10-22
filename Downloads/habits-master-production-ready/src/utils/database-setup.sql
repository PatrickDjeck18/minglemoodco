-- Database setup script for FaithHabits app
-- Run this in your Supabase SQL editor to create all required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  is_answered BOOLEAN DEFAULT FALSE,
  prayer_count INTEGER DEFAULT 0,
  answered_date TIMESTAMP WITH TIME ZONE,
  testimony TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer sessions table
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practices table
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT,
  goal INTEGER,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practice logs table
CREATE TABLE IF NOT EXISTS practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily devotions table
CREATE TABLE IF NOT EXISTS daily_devotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gratitude entries table
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  entries TEXT[] NOT NULL,
  prayer_of_thanksgiving TEXT,
  scripture_reference TEXT,
  mood_before TEXT CHECK (mood_before IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
  mood_after TEXT CHECK (mood_after IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
  gratitude_focus TEXT[] CHECK (gratitude_focus <@ ARRAY['family', 'health', 'work', 'relationships', 'spiritual', 'material', 'experiences', 'growth']),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Fasting records table
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'food', 'social_media', 'entertainment', 'custom')),
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  purpose TEXT,
  prayer_focus TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worship sessions table
CREATE TABLE IF NOT EXISTS worship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('personal', 'corporate', 'online', 'small_group', 'family')),
  duration_minutes INTEGER NOT NULL,
  songs TEXT[],
  scripture_focus TEXT,
  worship_style TEXT CHECK (worship_style IN ('contemporary', 'traditional', 'blended', 'acapella')),
  location TEXT,
  notes TEXT,
  spiritual_impact TEXT,
  emotions_experienced TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service records table
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('volunteer', 'ministry', 'outreach', 'mission', 'community_service', 'church_service', 'evangelism')),
  organization TEXT,
  activity TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(4,2),
  date DATE NOT NULL,
  location TEXT,
  impact_notes TEXT,
  people_served INTEGER,
  spiritual_impact TEXT,
  lessons_learned TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian books table
CREATE TABLE IF NOT EXISTS christian_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  genre TEXT,
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('reading', 'completed', 'paused', 'want_to_read')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  notes TEXT,
  start_date DATE,
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian habit templates table
CREATE TABLE IF NOT EXISTS christian_habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT,
  duration_minutes INTEGER,
  scripture_reference TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian habits table
CREATE TABLE IF NOT EXISTS christian_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES christian_habit_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT,
  goal INTEGER,
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Christian habit completions table
CREATE TABLE IF NOT EXISTS christian_habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES christian_habits(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spiritual milestones table
CREATE TABLE IF NOT EXISTS spiritual_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  date DATE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  testimony TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_prayer_time INTEGER DEFAULT 0,
  total_reading_time INTEGER DEFAULT 0,
  total_fasting_hours INTEGER DEFAULT 0,
  total_worship_time INTEGER DEFAULT 0,
  total_service_hours INTEGER DEFAULT 0,
  prayer_streak INTEGER DEFAULT 0,
  reading_streak INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practices_user_id ON practices(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_devotions_user_id ON daily_devotions(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON gratitude_entries(date);
CREATE INDEX IF NOT EXISTS idx_fasting_records_user_id ON fasting_records(user_id);
CREATE INDEX IF NOT EXISTS idx_worship_sessions_user_id ON worship_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_user_id ON service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_books_user_id ON christian_books(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_habits_user_id ON christian_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_user_id ON spiritual_milestones(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_devotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE worship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own prayer requests" ON prayer_requests FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own prayer requests" ON prayer_requests FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own prayer sessions" ON prayer_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own practices" ON practices FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own practices" ON practices FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own practices" ON practices FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own practices" ON practices FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own practice logs" ON practice_logs FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM practices WHERE id = practice_id));
CREATE POLICY "Users can insert own practice logs" ON practice_logs FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id FROM practices WHERE id = practice_id));

CREATE POLICY "Users can view own daily devotions" ON daily_devotions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own daily devotions" ON daily_devotions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own daily devotions" ON daily_devotions FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own gratitude entries" ON gratitude_entries FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own gratitude entries" ON gratitude_entries FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own gratitude entries" ON gratitude_entries FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own fasting records" ON fasting_records FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own fasting records" ON fasting_records FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own fasting records" ON fasting_records FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own worship sessions" ON worship_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own worship sessions" ON worship_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own service records" ON service_records FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own service records" ON service_records FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own christian books" ON christian_books FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own christian books" ON christian_books FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own christian books" ON christian_books FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own christian habits" ON christian_habits FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own christian habits" ON christian_habits FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own christian habits" ON christian_habits FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own habit completions" ON christian_habit_completions FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM christian_habits WHERE id = habit_id));
CREATE POLICY "Users can insert own habit completions" ON christian_habit_completions FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id FROM christian_habits WHERE id = habit_id));

CREATE POLICY "Users can view own spiritual milestones" ON spiritual_milestones FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own spiritual milestones" ON spiritual_milestones FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own statistics" ON statistics FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own statistics" ON statistics FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own statistics" ON statistics FOR UPDATE USING (auth.uid()::text = user_id::text);
