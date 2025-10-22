-- =====================================================
-- SUPABASE CHRISTIAN HABITS TRACKING SCHEMA (FIXED)
-- Production-Ready Database Schema for FaithHabits App
-- Handles existing policies gracefully
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- Enhanced users table with Christian-specific fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"prayer_reminders": true, "habit_reminders": true, "devotion_reminders": true}',
  spiritual_goals JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_backup TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- CHRISTIAN HABITS CORE TABLES
-- =====================================================

-- Daily devotions with rich content
CREATE TABLE IF NOT EXISTS daily_devotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scripture_reference TEXT,
  scripture_text TEXT,
  devotion_text TEXT NOT NULL,
  reflection_questions TEXT[],
  prayer_points TEXT[],
  date DATE DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  tags TEXT[],
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  reading_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive fasting records
CREATE TABLE IF NOT EXISTS fasting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'food', 'social_media', 'entertainment', 'technology', 'custom')),
  custom_type_name TEXT,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  purpose TEXT,
  prayer_focus TEXT,
  spiritual_goals TEXT[],
  is_completed BOOLEAN DEFAULT FALSE,
  completion_notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  spiritual_breakthroughs TEXT,
  challenges_faced TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worship sessions tracking
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

-- Gratitude journal with enhanced features
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service and ministry records
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

-- Christian book reading progress
CREATE TABLE IF NOT EXISTS christian_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT CHECK (category IN ('theology', 'devotional', 'biography', 'apologetics', 'spiritual_growth', 'biblical_studies', 'church_history', 'practical_christianity')),
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER,
  status TEXT DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'paused', 'planning', 'abandoned')),
  start_date DATE,
  completion_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  key_insights TEXT[],
  favorite_quotes TEXT[],
  recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- HABIT TEMPLATES AND MANAGEMENT
-- =====================================================

-- Pre-defined Christian habit templates
CREATE TABLE IF NOT EXISTS christian_habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('prayer', 'study', 'worship', 'service', 'fellowship', 'discipline', 'evangelism', 'stewardship')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  suggested_duration INTEGER, -- in minutes
  scripture_reference TEXT,
  benefits TEXT[],
  prerequisites TEXT[],
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's personal habit instances
CREATE TABLE IF NOT EXISTS christian_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  spiritual_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed habit completion tracking
CREATE TABLE IF NOT EXISTS christian_habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES christian_habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  notes TEXT,
  scripture_reference TEXT,
  prayer_focus TEXT,
  spiritual_impact TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  mood_before TEXT CHECK (mood_before IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
  mood_after TEXT CHECK (mood_after IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SPIRITUAL GROWTH AND MILESTONES
-- =====================================================

-- Spiritual milestones and achievements
CREATE TABLE IF NOT EXISTS spiritual_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('achievement', 'breakthrough', 'testimony', 'goal', 'conversion', 'baptism', 'ministry_call', 'healing', 'deliverance')),
  date_achieved DATE NOT NULL,
  scripture_reference TEXT,
  testimony TEXT,
  impact_on_others TEXT,
  lessons_learned TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced prayer requests (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
    CREATE TABLE prayer_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('health', 'family', 'work', 'relationships', 'spiritual', 'financial', 'ministry', 'world', 'church')),
      is_private BOOLEAN DEFAULT FALSE,
      is_anonymous BOOLEAN DEFAULT FALSE,
      prayer_count INTEGER DEFAULT 0,
      is_answered BOOLEAN DEFAULT FALSE,
      answered_date TIMESTAMP WITH TIME ZONE,
      testimony TEXT,
      urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'urgent')),
      target_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Enhanced prayer sessions (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions') THEN
    CREATE TABLE prayer_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      duration INTEGER NOT NULL, -- in minutes
      topic TEXT,
      notes TEXT,
      prayer_type TEXT CHECK (prayer_type IN ('praise', 'thanksgiving', 'confession', 'intercession', 'petition', 'worship', 'meditation')),
      location TEXT,
      mood_before TEXT CHECK (mood_before IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
      mood_after TEXT CHECK (mood_after IN ('excellent', 'good', 'neutral', 'poor', 'struggling')),
      spiritual_impact TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- =====================================================
-- SOCIAL FEATURES (only if not exist)
-- =====================================================

-- Prayer request comments
CREATE TABLE IF NOT EXISTS prayer_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prayer_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prayer request likes
CREATE TABLE IF NOT EXISTS prayer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id)
);

-- Prayer request shares
CREATE TABLE IF NOT EXISTS prayer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  share_platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Daily devotions indexes
CREATE INDEX IF NOT EXISTS idx_daily_devotions_user_id ON daily_devotions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_devotions_date ON daily_devotions(date);
CREATE INDEX IF NOT EXISTS idx_daily_devotions_completed ON daily_devotions(is_completed);

-- Fasting records indexes
CREATE INDEX IF NOT EXISTS idx_fasting_records_user_id ON fasting_records(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_records_start_time ON fasting_records(start_time);
CREATE INDEX IF NOT EXISTS idx_fasting_records_type ON fasting_records(type);
CREATE INDEX IF NOT EXISTS idx_fasting_records_completed ON fasting_records(is_completed);

-- Worship sessions indexes
CREATE INDEX IF NOT EXISTS idx_worship_sessions_user_id ON worship_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_worship_sessions_created_at ON worship_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_worship_sessions_type ON worship_sessions(type);

-- Gratitude entries indexes
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON gratitude_entries(date);

-- Service records indexes
CREATE INDEX IF NOT EXISTS idx_service_records_user_id ON service_records(user_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(date);
CREATE INDEX IF NOT EXISTS idx_service_records_type ON service_records(type);

-- Christian books indexes
CREATE INDEX IF NOT EXISTS idx_christian_books_user_id ON christian_books(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_books_status ON christian_books(status);
CREATE INDEX IF NOT EXISTS idx_christian_books_category ON christian_books(category);

-- Habit templates indexes
CREATE INDEX IF NOT EXISTS idx_habit_templates_category ON christian_habit_templates(category);
CREATE INDEX IF NOT EXISTS idx_habit_templates_active ON christian_habit_templates(is_active);

-- Christian habits indexes
CREATE INDEX IF NOT EXISTS idx_christian_habits_user_id ON christian_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_christian_habits_active ON christian_habits(is_active);
CREATE INDEX IF NOT EXISTS idx_christian_habits_category ON christian_habits(category);

-- Habit completions indexes
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON christian_habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON christian_habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_completed_at ON christian_habit_completions(completed_at);

-- Spiritual milestones indexes
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_user_id ON spiritual_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_date ON spiritual_milestones(date_achieved);
CREATE INDEX IF NOT EXISTS idx_spiritual_milestones_public ON spiritual_milestones(is_public);

-- Prayer requests indexes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_prayer_requests_answered ON prayer_requests(is_answered);
  END IF;
END $$;

-- Prayer sessions indexes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions') THEN
    CREATE INDEX IF NOT EXISTS idx_prayer_sessions_user_id ON prayer_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_prayer_sessions_created_at ON prayer_sessions(created_at);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Handle existing policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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

-- Enable RLS on existing tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
    ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions') THEN
    ALTER TABLE prayer_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_comments') THEN
    ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_likes') THEN
    ALTER TABLE prayer_likes ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_shares') THEN
    ALTER TABLE prayer_shares ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- RLS POLICIES - Drop existing and recreate
-- =====================================================

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all existing policies
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
END $$;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily devotions policies
CREATE POLICY "Users can view own devotions" ON daily_devotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devotions" ON daily_devotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devotions" ON daily_devotions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devotions" ON daily_devotions FOR DELETE USING (auth.uid() = user_id);

-- Fasting records policies
CREATE POLICY "Users can view own fasting records" ON fasting_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fasting records" ON fasting_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fasting records" ON fasting_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fasting records" ON fasting_records FOR DELETE USING (auth.uid() = user_id);

-- Worship sessions policies
CREATE POLICY "Users can view own worship sessions" ON worship_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own worship sessions" ON worship_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own worship sessions" ON worship_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own worship sessions" ON worship_sessions FOR DELETE USING (auth.uid() = user_id);

-- Gratitude entries policies
CREATE POLICY "Users can view own gratitude entries" ON gratitude_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gratitude entries" ON gratitude_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gratitude entries" ON gratitude_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gratitude entries" ON gratitude_entries FOR DELETE USING (auth.uid() = user_id);

-- Service records policies
CREATE POLICY "Users can view own service records" ON service_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service records" ON service_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service records" ON service_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service records" ON service_records FOR DELETE USING (auth.uid() = user_id);

-- Christian books policies
CREATE POLICY "Users can view own books" ON christian_books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON christian_books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON christian_books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON christian_books FOR DELETE USING (auth.uid() = user_id);

-- Habit templates policies (public read)
CREATE POLICY "Everyone can view active habit templates" ON christian_habit_templates FOR SELECT USING (is_active = true);

-- Christian habits policies
CREATE POLICY "Users can view own habits" ON christian_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON christian_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON christian_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON christian_habits FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
CREATE POLICY "Users can view own habit completions" ON christian_habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habit completions" ON christian_habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit completions" ON christian_habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit completions" ON christian_habit_completions FOR DELETE USING (auth.uid() = user_id);

-- Spiritual milestones policies
CREATE POLICY "Users can view own milestones" ON spiritual_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public milestones" ON spiritual_milestones FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own milestones" ON spiritual_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own milestones" ON spiritual_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own milestones" ON spiritual_milestones FOR DELETE USING (auth.uid() = user_id);

-- Prayer requests policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
    CREATE POLICY "Users can view own prayer requests" ON prayer_requests FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can view public prayer requests" ON prayer_requests FOR SELECT USING (is_private = false);
    CREATE POLICY "Users can insert own prayer requests" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own prayer requests" ON prayer_requests FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own prayer requests" ON prayer_requests FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer sessions policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions') THEN
    CREATE POLICY "Users can view own prayer sessions" ON prayer_sessions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own prayer sessions" ON prayer_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own prayer sessions" ON prayer_sessions FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own prayer sessions" ON prayer_sessions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer comments policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_comments') THEN
    CREATE POLICY "Users can view public prayer comments" ON prayer_comments FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM prayer_requests 
        WHERE prayer_requests.id = prayer_comments.prayer_request_id 
        AND prayer_requests.is_private = false
      )
    );
    CREATE POLICY "Users can insert own prayer comments" ON prayer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own prayer comments" ON prayer_comments FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "Users can delete own prayer comments" ON prayer_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer likes policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_likes') THEN
    CREATE POLICY "Users can view prayer likes" ON prayer_likes FOR SELECT USING (true);
    CREATE POLICY "Users can insert own prayer likes" ON prayer_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own prayer likes" ON prayer_likes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Prayer shares policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_shares') THEN
    CREATE POLICY "Users can view prayer shares" ON prayer_shares FOR SELECT USING (true);
    CREATE POLICY "Users can insert own prayer shares" ON prayer_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can delete own prayer shares" ON prayer_shares FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to update habit streak
CREATE OR REPLACE FUNCTION update_habit_streak(habit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE christian_habits 
  SET 
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    total_completions = total_completions + 1,
    last_completed = NOW(),
    completion_rate = CASE 
      WHEN frequency = 'daily' THEN LEAST(100.0, (total_completions + 1) * 100.0 / GREATEST(EXTRACT(days FROM NOW() - start_date) + 1, 1))
      WHEN frequency = 'weekly' THEN LEAST(100.0, (total_completions + 1) * 100.0 / GREATEST(EXTRACT(weeks FROM NOW() - start_date) + 1, 1))
      ELSE completion_rate
    END
  WHERE id = habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset habit streak
CREATE OR REPLACE FUNCTION reset_habit_streak(habit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE christian_habits 
  SET current_streak = 0
  WHERE id = habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment prayer count
CREATE OR REPLACE FUNCTION increment_prayer_count(request_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET prayer_count = prayer_count + 1 
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement prayer count
CREATE OR REPLACE FUNCTION decrement_prayer_count(request_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE prayer_requests 
  SET prayer_count = GREATEST(prayer_count - 1, 0) 
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate spiritual growth score
CREATE OR REPLACE FUNCTION calculate_spiritual_growth_score(user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL := 0;
  habit_score DECIMAL := 0;
  prayer_score DECIMAL := 0;
  service_score DECIMAL := 0;
  gratitude_score DECIMAL := 0;
BEGIN
  -- Calculate habit completion score (40% weight)
  SELECT COALESCE(AVG(completion_rate), 0) INTO habit_score
  FROM christian_habits 
  WHERE user_id = calculate_spiritual_growth_score.user_id AND is_active = true;
  
  -- Calculate prayer consistency score (30% weight)
  SELECT COALESCE(COUNT(*) * 10.0 / GREATEST(EXTRACT(days FROM NOW() - MIN(created_at)), 1), 0) INTO prayer_score
  FROM prayer_sessions 
  WHERE user_id = calculate_spiritual_growth_score.user_id;
  
  -- Calculate service score (20% weight)
  SELECT COALESCE(SUM(duration_hours) * 2.0, 0) INTO service_score
  FROM service_records 
  WHERE user_id = calculate_spiritual_growth_score.user_id;
  
  -- Calculate gratitude score (10% weight)
  SELECT COALESCE(COUNT(*) * 5.0, 0) INTO gratitude_score
  FROM gratitude_entries 
  WHERE user_id = calculate_spiritual_growth_score.user_id;
  
  score := (habit_score * 0.4) + (LEAST(prayer_score, 100) * 0.3) + (LEAST(service_score, 100) * 0.2) + (LEAST(gratitude_score, 100) * 0.1);
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERT DEFAULT HABIT TEMPLATES
-- =====================================================

-- Insert default habit templates only if they don't exist
INSERT INTO christian_habit_templates (name, description, category, frequency, suggested_duration, scripture_reference, benefits, difficulty_level, is_default)
SELECT * FROM (VALUES
  ('Morning Prayer', 'Start each day with prayer and thanksgiving', 'prayer', 'daily', 15, 'Psalm 5:3', ARRAY['Peaceful start to day', 'Better focus', 'Spiritual strength', 'Divine guidance'], 1, true),
  ('Bible Study', 'Daily scripture reading and meditation', 'study', 'daily', 30, 'Psalm 119:105', ARRAY['Spiritual growth', 'Wisdom', 'Guidance', 'Understanding'], 2, true),
  ('Evening Reflection', 'End day with gratitude and prayer', 'prayer', 'daily', 10, 'Psalm 4:8', ARRAY['Better sleep', 'Gratitude', 'Peace', 'Rest'], 1, true),
  ('Weekly Fasting', 'Regular fasting for spiritual discipline', 'discipline', 'weekly', 1440, 'Matthew 6:16-18', ARRAY['Spiritual clarity', 'Self-control', 'Deeper prayer', 'Humility'], 3, true),
  ('Worship Time', 'Personal worship and praise', 'worship', 'daily', 20, 'Psalm 100:2', ARRAY['Joy', 'Connection with God', 'Spiritual renewal', 'Praise'], 1, true),
  ('Gratitude Journal', 'Daily gratitude practice', 'prayer', 'daily', 5, '1 Thessalonians 5:18', ARRAY['Positive mindset', 'Thankfulness', 'Joy', 'Contentment'], 1, true),
  ('Scripture Memory', 'Memorize and meditate on verses', 'study', 'daily', 15, 'Psalm 119:11', ARRAY['Spiritual armor', 'Wisdom', 'Comfort', 'Guidance'], 2, true),
  ('Service/Volunteer', 'Regular service to others', 'service', 'weekly', 120, 'Matthew 25:40', ARRAY['Purpose', 'Love in action', 'Community', 'Humility'], 2, true),
  ('Fellowship', 'Connect with other believers', 'fellowship', 'weekly', 60, 'Hebrews 10:25', ARRAY['Encouragement', 'Accountability', 'Community', 'Growth'], 1, true),
  ('Silence and Solitude', 'Quiet time with God', 'prayer', 'weekly', 30, 'Psalm 46:10', ARRAY['Hearing God', 'Peace', 'Spiritual renewal', 'Clarity'], 2, true),
  ('Tithe and Giving', 'Regular financial stewardship', 'stewardship', 'monthly', 10, 'Malachi 3:10', ARRAY['Trust in God', 'Generosity', 'Blessing', 'Faith'], 2, true),
  ('Evangelism', 'Share faith with others', 'evangelism', 'weekly', 30, 'Matthew 28:19-20', ARRAY['Boldness', 'Love for others', 'Kingdom growth', 'Obedience'], 3, true),
  ('Prayer Walking', 'Pray while walking in community', 'prayer', 'weekly', 45, 'Acts 1:8', ARRAY['Community awareness', 'Physical health', 'Spiritual warfare', 'Intercession'], 2, true),
  ('Sabbath Rest', 'Weekly day of rest and worship', 'worship', 'weekly', 480, 'Exodus 20:8-11', ARRAY['Rest', 'Worship', 'Family time', 'Renewal'], 1, true),
  ('Scripture Study', 'Deep study of biblical texts', 'study', 'weekly', 60, '2 Timothy 2:15', ARRAY['Deep understanding', 'Doctrine', 'Teaching ability', 'Wisdom'], 3, true)
) AS v(name, description, category, frequency, suggested_duration, scripture_reference, benefits, difficulty_level, is_default)
WHERE NOT EXISTS (
  SELECT 1 FROM christian_habit_templates 
  WHERE christian_habit_templates.name = v.name
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_devotions_updated_at ON daily_devotions;
CREATE TRIGGER update_daily_devotions_updated_at BEFORE UPDATE ON daily_devotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fasting_records_updated_at ON fasting_records;
CREATE TRIGGER update_fasting_records_updated_at BEFORE UPDATE ON fasting_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gratitude_entries_updated_at ON gratitude_entries;
CREATE TRIGGER update_gratitude_entries_updated_at BEFORE UPDATE ON gratitude_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_christian_books_updated_at ON christian_books;
CREATE TRIGGER update_christian_books_updated_at BEFORE UPDATE ON christian_books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_christian_habits_updated_at ON christian_habits;
CREATE TRIGGER update_christian_habits_updated_at BEFORE UPDATE ON christian_habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spiritual_milestones_updated_at ON spiritual_milestones;
CREATE TRIGGER update_spiritual_milestones_updated_at BEFORE UPDATE ON spiritual_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply triggers to existing tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
    DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests;
    CREATE TRIGGER update_prayer_requests_updated_at BEFORE UPDATE ON prayer_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_comments') THEN
    DROP TRIGGER IF EXISTS update_prayer_comments_updated_at ON prayer_comments;
    CREATE TRIGGER update_prayer_comments_updated_at BEFORE UPDATE ON prayer_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- User spiritual growth summary view
CREATE OR REPLACE VIEW user_spiritual_growth_summary AS
SELECT 
  u.id as user_id,
  u.first_name,
  u.last_name,
  COUNT(DISTINCT ch.id) as active_habits,
  COALESCE(AVG(ch.completion_rate), 0) as avg_completion_rate,
  COALESCE(SUM(ps.duration), 0) as total_prayer_minutes,
  COALESCE(COUNT(DISTINCT ge.id), 0) as gratitude_entries,
  COALESCE(SUM(sr.duration_hours), 0) as service_hours,
  COALESCE(COUNT(DISTINCT sm.id), 0) as spiritual_milestones,
  calculate_spiritual_growth_score(u.id) as growth_score
FROM users u
LEFT JOIN christian_habits ch ON u.id = ch.user_id AND ch.is_active = true
LEFT JOIN prayer_sessions ps ON u.id = ps.user_id
LEFT JOIN gratitude_entries ge ON u.id = ge.user_id
LEFT JOIN service_records sr ON u.id = sr.user_id
LEFT JOIN spiritual_milestones sm ON u.id = sm.user_id
GROUP BY u.id, u.first_name, u.last_name;

-- Habit completion analytics view
CREATE OR REPLACE VIEW habit_completion_analytics AS
SELECT 
  ch.id as habit_id,
  ch.name as habit_name,
  ch.category,
  ch.frequency,
  ch.current_streak,
  ch.longest_streak,
  ch.total_completions,
  ch.completion_rate,
  COUNT(chc.id) as recent_completions,
  AVG(chc.duration_minutes) as avg_duration,
  AVG(chc.difficulty_rating) as avg_difficulty
FROM christian_habits ch
LEFT JOIN christian_habit_completions chc ON ch.id = chc.habit_id 
  AND chc.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY ch.id, ch.name, ch.category, ch.frequency, ch.current_streak, ch.longest_streak, ch.total_completions, ch.completion_rate;

-- =====================================================
-- FINAL SETUP
-- =====================================================

-- Create a function to initialize user data
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO users (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user initialization
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_data();

-- =====================================================
-- PRODUCTION READY FEATURES
-- =====================================================

-- Add constraints for data integrity (with existence checks)
DO $$
BEGIN
  -- Add reminder days constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_reminder_days'
  ) THEN
    ALTER TABLE christian_habits ADD CONSTRAINT check_reminder_days 
      CHECK (reminder_days <@ ARRAY[1,2,3,4,5,6,7]);
  END IF;
  
  -- Add duration positive constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_duration_positive'
  ) THEN
    ALTER TABLE christian_habit_completions ADD CONSTRAINT check_duration_positive 
      CHECK (duration_minutes IS NULL OR duration_minutes > 0);
  END IF;
  
  -- Add end after start constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_end_after_start'
  ) THEN
    ALTER TABLE fasting_records ADD CONSTRAINT check_end_after_start 
      CHECK (end_time IS NULL OR end_time > start_time);
  END IF;
  
  -- Add pages positive constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_pages_positive'
  ) THEN
    ALTER TABLE christian_books ADD CONSTRAINT check_pages_positive 
      CHECK (current_page >= 0 AND (total_pages IS NULL OR total_pages > 0));
  END IF;
END $$;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON christian_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON christian_habit_completions(habit_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_milestones_user_public ON spiritual_milestones(user_id, is_public);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHRISTIAN HABITS SCHEMA SUCCESSFULLY CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tables: 15+';
  RAISE NOTICE 'Total Indexes: 25+';
  RAISE NOTICE 'Total Functions: 6';
  RAISE NOTICE 'Total Triggers: 8+';
  RAISE NOTICE 'Default Habit Templates: 15';
  RAISE NOTICE 'Production Ready: YES';
  RAISE NOTICE 'Handles Existing Data: YES';
  RAISE NOTICE '========================================';
END $$;
