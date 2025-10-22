-- Supabase Database Schema for Habits Master App
-- This migration creates all necessary tables and security policies

-- Note: The 'auth.users' table already exists in Supabase
-- We'll create a 'user_profiles' table to store additional user data

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
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
  is_private BOOLEAN DEFAULT FALSE,
  prayer_count INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT FALSE,
  answered_date TIMESTAMP WITH TIME ZONE,
  testimony TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER,
  verse_end INTEGER,
  date_read TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory verses table
CREATE TABLE IF NOT EXISTS memory_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  translation TEXT DEFAULT 'NIV',
  is_memorized BOOLEAN DEFAULT FALSE,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer sessions table
CREATE TABLE IF NOT EXISTS prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- in seconds
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practices table
CREATE TABLE IF NOT EXISTS practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading plans table
CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Practice logs table
CREATE TABLE IF NOT EXISTS practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devotion notes table
CREATE TABLE IF NOT EXISTS devotion_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prayers_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- in minutes
  verses_memorized INTEGER DEFAULT 0,
  practices_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotion_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Prayer requests policies
CREATE POLICY "Users can view own prayer requests" ON prayer_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayer requests" ON prayer_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayer requests" ON prayer_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer requests" ON prayer_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Reading progress policies
CREATE POLICY "Users can view own reading progress" ON reading_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress" ON reading_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress" ON reading_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Memory verses policies
CREATE POLICY "Users can view own memory verses" ON memory_verses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory verses" ON memory_verses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory verses" ON memory_verses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory verses" ON memory_verses
  FOR DELETE USING (auth.uid() = user_id);

-- Prayer sessions policies
CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prayer sessions" ON prayer_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prayer sessions" ON prayer_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayer sessions" ON prayer_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Practices policies
CREATE POLICY "Users can view own practices" ON practices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practices" ON practices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practices" ON practices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practices" ON practices
  FOR DELETE USING (auth.uid() = user_id);

-- Reading plans policies
CREATE POLICY "Users can view own reading plans" ON reading_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading plans" ON reading_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading plans" ON reading_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading plans" ON reading_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Practice logs policies
CREATE POLICY "Users can view own practice logs" ON practice_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice logs" ON practice_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice logs" ON practice_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice logs" ON practice_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Devotion notes policies
CREATE POLICY "Users can view own devotion notes" ON devotion_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devotion notes" ON devotion_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devotion notes" ON devotion_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devotion notes" ON devotion_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Statistics policies
CREATE POLICY "Users can view own statistics" ON statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON statistics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON statistics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statistics" ON statistics
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_verses_user_id ON memory_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practices_user_id ON practices(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_plans_user_id ON reading_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_logs_user_id ON practice_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_devotion_notes_user_id ON devotion_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON statistics(user_id);

-- Create a function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
