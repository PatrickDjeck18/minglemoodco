-- SIMPLE DELETE TEST
-- This script tests if we can delete fasting records

-- 1. Check if we have any fasting records
SELECT 'Checking existing fasting records...' as status;

SELECT 
  id,
  user_id,
  type,
  start_time,
  end_time,
  created_at
FROM fasting_records 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Test delete permissions (replace with actual record ID)
-- Uncomment and replace with a real record ID to test
-- DELETE FROM fasting_records WHERE id = 'your-record-id-here';

-- 3. Check if DELETE policy exists
SELECT 'Checking DELETE policy...' as status;

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'fasting_records'
AND cmd = 'DELETE';

-- 4. Check RLS status
SELECT 'Checking RLS status...' as status;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'fasting_records';

SELECT 'Test complete! Check the results above.' as status;
