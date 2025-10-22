-- TEST DELETE FUNCTION
-- This script helps test if the delete functionality is working

-- Test the simple_delete_habit function
-- Replace 'your-habit-id-here' with an actual habit ID from your database
DO $$
DECLARE
  test_habit_id UUID;
  result BOOLEAN;
BEGIN
  -- Get a habit ID to test with
  SELECT id INTO test_habit_id FROM christian_habits LIMIT 1;
  
  IF test_habit_id IS NULL THEN
    RAISE NOTICE 'No habits found to test with';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing delete with habit ID: %', test_habit_id;
  
  -- Test the function
  SELECT simple_delete_habit(test_habit_id) INTO result;
  
  IF result THEN
    RAISE NOTICE 'Delete test PASSED - habit was deleted successfully';
  ELSE
    RAISE NOTICE 'Delete test FAILED - habit was not deleted';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Delete test ERROR: %', SQLERRM;
END $$;

-- Check current habits count
SELECT COUNT(*) as total_habits FROM christian_habits;
SELECT COUNT(*) as total_completions FROM christian_habit_completions;
