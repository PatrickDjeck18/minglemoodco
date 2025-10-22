-- QUICK FIX FOR WEEKS INTERVAL ERROR
-- This script fixes the update_habit_streak function to remove the weeks interval error

-- Drop and recreate the update_habit_streak function with the fix
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_habit_streak(UUID) TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'update_habit_streak function has been fixed! The weeks interval error should be resolved.';
END $$;
