-- FIX DELETE POLICY FOR CHRISTIAN HABITS
-- This script adds the missing DELETE policy for christian_habits table

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can delete own christian habits" ON christian_habits;
DROP POLICY IF EXISTS "Users can delete own habit completions" ON christian_habit_completions;

-- Add DELETE policy for christian_habits
CREATE POLICY "Users can delete own christian habits" ON christian_habits 
FOR DELETE USING (auth.uid()::text = user_id::text);

-- Add DELETE policy for christian_habit_completions
CREATE POLICY "Users can delete own habit completions" ON christian_habit_completions 
FOR DELETE USING (auth.uid()::text = user_id::text);
