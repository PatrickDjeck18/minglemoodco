-- CREATE RPC FUNCTION FOR DELETING CHRISTIAN HABITS
-- This creates a server-side function that can delete habits with proper permissions

CREATE OR REPLACE FUNCTION delete_christian_habit(habit_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete all related completions first
  DELETE FROM christian_habit_completions 
  WHERE christian_habit_completions.habit_id = delete_christian_habit.habit_id;
  
  -- Delete the habit itself
  DELETE FROM christian_habits 
  WHERE christian_habits.id = delete_christian_habit.habit_id
  AND christian_habits.user_id = auth.uid();
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found or you do not have permission to delete it';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_christian_habit(UUID) TO authenticated;
