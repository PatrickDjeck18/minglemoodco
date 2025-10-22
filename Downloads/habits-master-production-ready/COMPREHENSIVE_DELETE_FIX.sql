-- COMPREHENSIVE DELETE FIX FOR CHRISTIAN HABITS
-- This script ensures all necessary policies and constraints are in place

-- =====================================================
-- CHECK AND FIX TABLE STRUCTURE
-- =====================================================

-- Ensure user_id column exists in christian_habit_completions
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

-- Update existing completion records to have user_id from the related habit
UPDATE christian_habit_completions 
SET user_id = (
  SELECT user_id 
  FROM christian_habits 
  WHERE christian_habits.id = christian_habit_completions.habit_id
)
WHERE user_id IS NULL;

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop all existing policies for christian_habits
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'christian_habits'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   policy_record.policyname, 
                   policy_record.schemaname, 
                   policy_record.tablename);
  END LOOP;
END $$;

-- Drop all existing policies for christian_habit_completions
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

-- =====================================================
-- CREATE ALL NECESSARY POLICIES
-- =====================================================

-- Christian Habits Policies
CREATE POLICY "Users can view own christian habits" ON christian_habits 
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own christian habits" ON christian_habits 
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own christian habits" ON christian_habits 
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own christian habits" ON christian_habits 
FOR DELETE USING (auth.uid()::text = user_id::text);

-- Christian Habit Completions Policies
CREATE POLICY "Users can view own habit completions" ON christian_habit_completions 
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own habit completions" ON christian_habit_completions 
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own habit completions" ON christian_habit_completions 
FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own habit completions" ON christian_habit_completions 
FOR DELETE USING (auth.uid()::text = user_id::text);

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- Show all policies for verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND (tablename = 'christian_habits' OR tablename = 'christian_habit_completions')
ORDER BY tablename, policyname;
