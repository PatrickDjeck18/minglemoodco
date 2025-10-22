-- VERIFY DATABASE SETUP
-- Run this to check if tables exist and diagnose issues

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('users', 'user_profiles', 'gratitude_entries', 'daily_devotions', 'prayer_sessions', 'prayer_requests') 
    THEN '✅ Required table exists'
    ELSE '❌ Missing required table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'gratitude_entries', 'daily_devotions', 'prayer_sessions', 'prayer_requests')
ORDER BY table_name;

-- Check if users table has the right structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'gratitude_entries', 'daily_devotions')
ORDER BY tablename;

-- Check if policies exist
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
AND tablename IN ('users', 'gratitude_entries', 'daily_devotions')
ORDER BY tablename, policyname;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test a simple query on users table
SELECT COUNT(*) as user_count FROM users;
