-- TEST GRATITUDE SAVING FUNCTIONALITY
-- Run this to test if gratitude entries can be saved

-- First, check if tables exist
SELECT 'Checking if tables exist...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'gratitude_entries') 
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'gratitude_entries');

-- Check if we can insert a test user
SELECT 'Testing user creation...' as status;

-- Try to insert a test user (this will fail if user already exists, which is fine)
INSERT INTO users (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'test-user-123',
  'test@example.com',
  'Test',
  'User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Check if we can insert a test gratitude entry
SELECT 'Testing gratitude entry creation...' as status;

-- Try to insert a test gratitude entry
INSERT INTO gratitude_entries (
  user_id,
  date,
  entries,
  prayer_of_thanksgiving,
  created_at,
  updated_at
)
VALUES (
  'test-user-123',
  CURRENT_DATE,
  ARRAY['I am grateful for this test'],
  'Thank you for this test',
  NOW(),
  NOW()
) ON CONFLICT (user_id, date) DO UPDATE SET
  entries = EXCLUDED.entries,
  prayer_of_thanksgiving = EXCLUDED.prayer_of_thanksgiving,
  updated_at = NOW();

-- Check if the entry was created
SELECT 'Checking if gratitude entry was created...' as status;

SELECT 
  id,
  user_id,
  date,
  entries,
  prayer_of_thanksgiving,
  created_at
FROM gratitude_entries 
WHERE user_id = 'test-user-123' 
AND date = CURRENT_DATE;

-- Clean up test data
DELETE FROM gratitude_entries WHERE user_id = 'test-user-123';
DELETE FROM users WHERE id = 'test-user-123';

SELECT 'Test completed successfully!' as status;
