-- TEST DELETE FASTING FUNCTIONALITY
-- Run this to test if fasting records can be deleted

-- First, check if fasting_records table exists
SELECT 'Checking if fasting_records table exists...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'fasting_records' 
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'fasting_records';

-- Check if DELETE policy exists
SELECT 'Checking DELETE policy...' as status;

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'fasting_records'
AND cmd = 'DELETE';

-- Test creating and deleting a fasting record
SELECT 'Testing delete functionality...' as status;

-- Create a test user first
INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'test-delete-user',
  'delete@example.com',
  'Delete',
  'Test',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert a test fasting record
INSERT INTO fasting_records (
  user_id,
  type,
  description,
  start_time,
  end_time,
  duration_minutes,
  purpose,
  prayer_focus,
  notes,
  created_at,
  updated_at
)
VALUES (
  'test-delete-user',
  'water',
  'Test fasting for deletion',
  NOW() - INTERVAL '2 hours',
  NOW(),
  120,
  'Testing delete functionality',
  'Prayer and meditation',
  'Test notes',
  NOW(),
  NOW()
) RETURNING id;

-- Check if the record was created
SELECT 'Checking created record...' as status;

SELECT 
  id,
  user_id,
  type,
  description,
  created_at
FROM fasting_records 
WHERE user_id = 'test-delete-user';

-- Test deleting the record
SELECT 'Testing record deletion...' as status;

DELETE FROM fasting_records 
WHERE user_id = 'test-delete-user';

-- Check if the record was deleted
SELECT 'Checking if record was deleted...' as status;

SELECT COUNT(*) as remaining_records
FROM fasting_records 
WHERE user_id = 'test-delete-user';

-- Clean up test user
DELETE FROM users WHERE id = 'test-delete-user';

SELECT 'Delete functionality test completed!' as status;
