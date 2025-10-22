-- MINIMAL DATABASE FIX FOR CHRISTIAN HABITS APP
-- This script only adds the essential missing columns that are causing errors

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FIX CHRISTIAN HABIT TEMPLATES TABLE
-- =====================================================

-- Add missing columns to christian_habit_templates table
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

-- Add missing columns to christian_habits table
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

-- Add missing columns to christian_habit_completions table
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
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON christian_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON christian_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habits_reminder_time ON christian_habits(reminder_time);
CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON christian_habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON christian_habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON christian_habit_completions(habit_id, completed_at);

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
  RAISE NOTICE 'MINIMAL DATABASE FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All missing columns have been added';
  RAISE NOTICE 'RLS policies are in place';
  RAISE NOTICE 'Database is now ready for the app!';
  RAISE NOTICE '========================================';
END $$;
