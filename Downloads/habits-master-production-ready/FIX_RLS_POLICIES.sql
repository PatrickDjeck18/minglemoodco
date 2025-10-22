-- FIX RLS POLICIES FOR CHRISTIAN HABIT COMPLETIONS
-- This script fixes the Row Level Security policies for the christian_habit_completions table

-- =====================================================
-- ADD USER_ID COLUMN TO COMPLETIONS TABLE
-- =====================================================

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'christian_habit_completions' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE christian_habit_completions 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- UPDATE EXISTING RECORDS WITH USER_ID
-- =====================================================

-- Update existing completion records to have user_id from the related habit
UPDATE christian_habit_completions 
SET user_id = (
  SELECT user_id 
  FROM christian_habits 
  WHERE christian_habits.id = christian_habit_completions.habit_id
)
WHERE user_id IS NULL;

-- =====================================================
-- DROP AND RECREATE RLS POLICIES
-- =====================================================

-- Drop existing policies for christian_habit_completions
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'christian_habit_completions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
END $$;

-- Create new RLS policies for christian_habit_completions
CREATE POLICY "Users can view own habit completions" 
ON christian_habit_completions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit completions" 
ON christian_habit_completions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit completions" 
ON christian_habit_completions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit completions" 
ON christian_habit_completions FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- FIX UPDATE_HABIT_STREAK FUNCTION
-- =====================================================

-- Fix the update_habit_streak function to handle weeks properly
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
      WHEN frequency = 'weekly' THEN LEAST(100.0, (total_completions + 1) * 100.0 / GREATEST(EXTRACT(days FROM NOW() - start_date) / 7 + 1, 1))
      ELSE completion_rate
    END
  WHERE id = habit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE COMPLETE FUNCTION TO INCLUDE USER_ID
-- =====================================================

-- Create or replace the completeChristianHabit function to include user_id
CREATE OR REPLACE FUNCTION complete_christian_habit(
  p_habit_id UUID,
  p_user_id UUID,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_scripture_reference TEXT DEFAULT NULL,
  p_prayer_focus TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Insert completion record with user_id
  INSERT INTO christian_habit_completions (
    habit_id,
    user_id,
    completion_date,
    duration_minutes,
    notes,
    scripture_reference,
    prayer_focus
  ) VALUES (
    p_habit_id,
    p_user_id,
    CURRENT_DATE,
    p_duration_minutes,
    p_notes,
    p_scripture_reference,
    p_prayer_focus
  );

  -- Update habit streak
  PERFORM update_habit_streak(p_habit_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION complete_christian_habit(UUID, UUID, INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for christian_habit_completions have been fixed successfully!';
  RAISE NOTICE 'The complete_christian_habit function has been created with proper user_id handling.';
END $$;
