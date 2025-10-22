-- DEBUG DELETE FASTING FUNCTIONALITY
-- This script helps diagnose delete button issues

-- 1. Check if fasting_records table exists and has data
SELECT '=== CHECKING FASTING_RECORDS TABLE ===' as status;

SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN end_time IS NOT NULL THEN 1 END) as completed_records,
  COUNT(CASE WHEN end_time IS NULL THEN 1 END) as active_records
FROM fasting_records;

-- 2. Check if DELETE policy exists
SELECT '=== CHECKING DELETE POLICY ===' as status;

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'fasting_records'
AND cmd = 'DELETE';

-- 3. Check RLS is enabled
SELECT '=== CHECKING RLS STATUS ===' as status;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'fasting_records';

-- 4. Test if we can delete a record (replace with actual user ID)
SELECT '=== TESTING DELETE PERMISSIONS ===' as status;

-- This will show if there are any records that can be deleted
SELECT 
  id,
  user_id,
  type,
  start_time,
  end_time,
  created_at
FROM fasting_records 
WHERE end_time IS NOT NULL
LIMIT 5;

-- 5. Check if the user has the right permissions
SELECT '=== CHECKING USER PERMISSIONS ===' as status;

-- This should return the current user's ID
SELECT auth.uid() as current_user_id;

-- 6. Test delete operation (uncomment to actually test)
-- DELETE FROM fasting_records WHERE id = 'some-record-id';

SELECT 'Debug complete! Check the results above.' as status;
