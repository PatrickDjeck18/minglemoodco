-- COMPLETE DATABASE FIX FOR CHRISTIAN HABITS APP
-- This script ensures all required columns and tables exist

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- FIX CHRISTIAN HABIT TEMPLATES TABLE
-- =====================================================

-- Ensure christian_habit_templates table exists with all required columns
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

-- Add missing columns to existing table
DO $$
BEGIN
  -- Add benefits column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'benefits'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN benefits TEXT[];
  END IF;

  -- Add prerequisites column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'prerequisites'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN prerequisites TEXT[];
  END IF;

  -- Add difficulty_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5);
  END IF;

  -- Add is_default column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN created_by UUID REFERENCES users(id);
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE christian_habit_templates 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- FIX CHRISTIAN HABITS TABLE
-- =====================================================

-- Ensure christian_habits table exists with all required columns
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

-- Add missing columns to existing table
DO $$
BEGIN
  -- Add reminder_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'reminder_time'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN reminder_time TIME;
  END IF;

  -- Add reminder_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'reminder_days'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN reminder_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7];
  END IF;

  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN start_date DATE DEFAULT CURRENT_DATE;
  END IF;

  -- Add last_completed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'last_completed'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN last_completed TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add completion_rate column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'completion_rate'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN completion_rate DECIMAL(5,2) DEFAULT 0.00;
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN notes TEXT;
  END IF;

  -- Add spiritual_goals column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'spiritual_goals'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN spiritual_goals TEXT[];
  END IF;

  -- Add target_duration column if it doesn't exist (rename from goal if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'target_duration'
  ) THEN
    -- Check if goal column exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'christian_habits' 
      AND column_name = 'goal'
    ) THEN
      ALTER TABLE christian_habits 
      RENAME COLUMN goal TO target_duration;
    ELSE
      ALTER TABLE christian_habits 
      ADD COLUMN target_duration INTEGER;
    END IF;
  END IF;

  -- Add current_streak column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;

  -- Add longest_streak column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'longest_streak'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN longest_streak INTEGER DEFAULT 0;
  END IF;

  -- Add total_completions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habits' 
    AND column_name = 'total_completions'
  ) THEN
    ALTER TABLE christian_habits 
    ADD COLUMN total_completions INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- FIX CHRISTIAN HABIT COMPLETIONS TABLE
-- =====================================================

-- Ensure christian_habit_completions table exists with all required columns
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

-- Add missing columns to existing table
DO $$
BEGIN
  -- Add user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add duration_minutes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN duration_minutes INTEGER;
  END IF;

  -- Add scripture_reference column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'scripture_reference'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN scripture_reference TEXT;
  END IF;

  -- Add prayer_focus column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'prayer_focus'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN prayer_focus TEXT;
  END IF;

  -- Add spiritual_impact column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'spiritual_impact'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN spiritual_impact TEXT;
  END IF;

  -- Add difficulty_rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'difficulty_rating'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);
  END IF;

  -- Add mood_before column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'mood_before'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN mood_before TEXT CHECK (mood_before IN ('excellent', 'good', 'neutral', 'poor', 'struggling'));
  END IF;

  -- Add mood_after column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'mood_after'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN mood_after TEXT CHECK (mood_after IN ('excellent', 'good', 'neutral', 'poor', 'struggling'));
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- ADD CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

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
END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_habit_templates_active ON christian_habit_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_templates_default ON christian_habit_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_habit_templates_category ON christian_habit_templates(category);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON christian_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON christian_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habits_reminder_time ON christian_habits(reminder_time);
CREATE INDEX IF NOT EXISTS idx_habits_category ON christian_habits(category);
CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON christian_habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON christian_habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON christian_habit_completions(habit_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_completions_completed_at ON christian_habit_completions(completed_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE christian_habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE christian_habit_completions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('christian_habit_templates', 'christian_habits', 'christian_habit_completions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
END $$;

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

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to christian_habit_templates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_christian_habit_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_christian_habit_templates_updated_at 
      BEFORE UPDATE ON christian_habit_templates 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Apply updated_at trigger to christian_habits if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_christian_habits_updated_at'
  ) THEN
    CREATE TRIGGER update_christian_habits_updated_at 
      BEFORE UPDATE ON christian_habits 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- CREATE BUSINESS LOGIC FUNCTIONS
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

-- =====================================================
-- INSERT DEFAULT HABIT TEMPLATES
-- =====================================================

-- Insert default habit templates only if they don't exist
-- First check if suggested_duration column exists, then insert accordingly
DO $$
BEGIN
  -- Check if suggested_duration column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_templates' 
    AND column_name = 'suggested_duration'
  ) THEN
    -- Insert with suggested_duration column
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
  ELSE
    -- Insert without suggested_duration column
    INSERT INTO christian_habit_templates (name, description, category, frequency, scripture_reference, benefits, difficulty_level, is_default)
    SELECT * FROM (VALUES
      ('Morning Prayer', 'Start each day with prayer and thanksgiving', 'prayer', 'daily', 'Psalm 5:3', ARRAY['Peaceful start to day', 'Better focus', 'Spiritual strength', 'Divine guidance'], 1, true),
      ('Bible Study', 'Daily scripture reading and meditation', 'study', 'daily', 'Psalm 119:105', ARRAY['Spiritual growth', 'Wisdom', 'Guidance', 'Understanding'], 2, true),
      ('Evening Reflection', 'End day with gratitude and prayer', 'prayer', 'daily', 'Psalm 4:8', ARRAY['Better sleep', 'Gratitude', 'Peace', 'Rest'], 1, true),
      ('Weekly Fasting', 'Regular fasting for spiritual discipline', 'discipline', 'weekly', 'Matthew 6:16-18', ARRAY['Spiritual clarity', 'Self-control', 'Deeper prayer', 'Humility'], 3, true),
      ('Worship Time', 'Personal worship and praise', 'worship', 'daily', 'Psalm 100:2', ARRAY['Joy', 'Connection with God', 'Spiritual renewal', 'Praise'], 1, true),
      ('Gratitude Journal', 'Daily gratitude practice', 'prayer', 'daily', '1 Thessalonians 5:18', ARRAY['Positive mindset', 'Thankfulness', 'Joy', 'Contentment'], 1, true),
      ('Scripture Memory', 'Memorize and meditate on verses', 'study', 'daily', 'Psalm 119:11', ARRAY['Spiritual armor', 'Wisdom', 'Comfort', 'Guidance'], 2, true),
      ('Service/Volunteer', 'Regular service to others', 'service', 'weekly', 'Matthew 25:40', ARRAY['Purpose', 'Love in action', 'Community', 'Humility'], 2, true),
      ('Fellowship', 'Connect with other believers', 'fellowship', 'weekly', 'Hebrews 10:25', ARRAY['Encouragement', 'Accountability', 'Community', 'Growth'], 1, true),
      ('Silence and Solitude', 'Quiet time with God', 'prayer', 'weekly', 'Psalm 46:10', ARRAY['Hearing God', 'Peace', 'Spiritual renewal', 'Clarity'], 2, true),
      ('Tithe and Giving', 'Regular financial stewardship', 'stewardship', 'monthly', 'Malachi 3:10', ARRAY['Trust in God', 'Generosity', 'Blessing', 'Faith'], 2, true),
      ('Evangelism', 'Share faith with others', 'evangelism', 'weekly', 'Matthew 28:19-20', ARRAY['Boldness', 'Love for others', 'Kingdom growth', 'Obedience'], 3, true),
      ('Prayer Walking', 'Pray while walking in community', 'prayer', 'weekly', 'Acts 1:8', ARRAY['Community awareness', 'Physical health', 'Spiritual warfare', 'Intercession'], 2, true),
      ('Sabbath Rest', 'Weekly day of rest and worship', 'worship', 'weekly', 'Exodus 20:8-11', ARRAY['Rest', 'Worship', 'Family time', 'Renewal'], 1, true),
      ('Scripture Study', 'Deep study of biblical texts', 'study', 'weekly', '2 Timothy 2:15', ARRAY['Deep understanding', 'Doctrine', 'Teaching ability', 'Wisdom'], 3, true)
    ) AS v(name, description, category, frequency, scripture_reference, benefits, difficulty_level, is_default)
    WHERE NOT EXISTS (
      SELECT 1 FROM christian_habit_templates 
      WHERE christian_habit_templates.name = v.name
    );
  END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHRISTIAN HABITS DATABASE FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All missing columns have been added';
  RAISE NOTICE 'All required tables are properly configured';
  RAISE NOTICE 'RLS policies are in place';
  RAISE NOTICE 'Default habit templates are ready';
  RAISE NOTICE 'Database is now ready for the app!';
  RAISE NOTICE '========================================';
END $$;
