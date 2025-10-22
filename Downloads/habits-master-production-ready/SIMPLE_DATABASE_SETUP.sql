-- SIMPLE DATABASE SETUP - ESSENTIAL TABLES ONLY
-- This creates just the core tables needed to fix the 406 errors

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate essential tables
DROP TABLE IF EXISTS gratitude_entries CASCADE;
DROP TABLE IF EXISTS daily_devotions CASCADE;
DROP TABLE IF EXISTS prayer_sessions CASCADE;
DROP TABLE IF EXISTS prayer_requests CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table that references auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
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
CREATE TABLE prayer_requests (
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
CREATE TABLE prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily devotions table
CREATE TABLE daily_devotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gratitude entries table
CREATE TABLE gratitude_entries (
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
CREATE TABLE fasting_records (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_devotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own user record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own user record" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own user record" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prayer requests" ON prayer_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prayer requests" ON prayer_requests FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prayer sessions" ON prayer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own daily devotions" ON daily_devotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily devotions" ON daily_devotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily devotions" ON daily_devotions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own gratitude entries" ON gratitude_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gratitude entries" ON gratitude_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gratitude entries" ON gratitude_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own fasting records" ON fasting_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fasting records" ON fasting_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fasting records" ON fasting_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fasting records" ON fasting_records FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically create a user record when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Success message
SELECT 'Simple database setup completed! Core tables created successfully.' as status;
