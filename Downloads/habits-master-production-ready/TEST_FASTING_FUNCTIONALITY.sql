-- TEST FASTING FUNCTIONALITY
-- Run this to test if fasting records can be saved and updated

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

-- Check table structure
SELECT 'Checking table structure...' as status;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'fasting_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test inserting a fasting record
SELECT 'Testing fasting record creation...' as status;

-- Create a test user first
INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'test-fasting-user',
  'fasting@example.com',
  'Fasting',
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
  purpose,
  prayer_focus,
  notes,
  created_at
)
VALUES (
  'test-fasting-user',
  'water',
  'Test fasting session',
  NOW() - INTERVAL '2 hours',
  'Spiritual discipline',
  'Prayer and meditation',
  'Test notes',
  NOW()
) RETURNING id;

-- Test updating the fasting record (ending the fast)
SELECT 'Testing fasting record update...' as status;

-- Update the record to end the fast
UPDATE fasting_records 
SET 
  end_time = NOW(),
  duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_time)) / 60,
  updated_at = NOW()
WHERE user_id = 'test-fasting-user' 
AND end_time IS NULL;

-- Check if the update worked
SELECT 'Checking updated record...' as status;

SELECT 
  id,
  user_id,
  type,
  start_time,
  end_time,
  duration_minutes,
  created_at,
  updated_at
FROM fasting_records 
WHERE user_id = 'test-fasting-user';

-- Clean up test data
DELETE FROM fasting_records WHERE user_id = 'test-fasting-user';
DELETE FROM users WHERE id = 'test-fasting-user';

SELECT 'Fasting functionality test completed!' as status;
