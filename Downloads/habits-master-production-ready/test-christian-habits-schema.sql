-- =====================================================
-- CHRISTIAN HABITS SCHEMA TESTING SCRIPT
-- Comprehensive testing for production readiness
-- =====================================================

-- =====================================================
-- TEST 1: SCHEMA VALIDATION
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  RAISE NOTICE '=== SCHEMA VALIDATION ===';
  
  -- Count tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'daily_devotions', 'fasting_records', 'worship_sessions',
    'gratitude_entries', 'service_records', 'christian_books',
    'christian_habit_templates', 'christian_habits', 'christian_habit_completions',
    'spiritual_milestones', 'prayer_requests', 'prayer_sessions',
    'prayer_comments', 'prayer_likes', 'prayer_shares'
  );
  
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
  
  -- Count functions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_habit_streak', 'reset_habit_streak', 'increment_prayer_count',
    'decrement_prayer_count', 'calculate_spiritual_growth_score', 'update_updated_at_column'
  );
  
  -- Count triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%';
  
  RAISE NOTICE 'Tables: % (Expected: 15)', table_count;
  RAISE NOTICE 'Indexes: % (Expected: 25+)', index_count;
  RAISE NOTICE 'Functions: % (Expected: 6)', function_count;
  RAISE NOTICE 'Triggers: % (Expected: 8)', trigger_count;
  
  IF table_count = 15 AND index_count >= 25 AND function_count = 6 AND trigger_count >= 8 THEN
    RAISE NOTICE '✅ Schema validation PASSED';
  ELSE
    RAISE NOTICE '❌ Schema validation FAILED';
  END IF;
END $$;

-- =====================================================
-- TEST 2: ROW LEVEL SECURITY
-- =====================================================

DO $$
DECLARE
  rls_enabled_count INTEGER;
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '=== ROW LEVEL SECURITY TEST ===';
  
  -- Check RLS is enabled
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND rowsecurity = true;
  
  -- Check policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Tables with RLS enabled: %', rls_enabled_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  
  IF rls_enabled_count >= 15 AND policy_count >= 30 THEN
    RAISE NOTICE '✅ RLS validation PASSED';
  ELSE
    RAISE NOTICE '❌ RLS validation FAILED';
  END IF;
END $$;

-- =====================================================
-- TEST 3: HABIT TEMPLATES
-- =====================================================

DO $$
DECLARE
  template_count INTEGER;
  default_count INTEGER;
BEGIN
  RAISE NOTICE '=== HABIT TEMPLATES TEST ===';
  
  -- Count total templates
  SELECT COUNT(*) INTO template_count FROM christian_habit_templates;
  
  -- Count default templates
  SELECT COUNT(*) INTO default_count FROM christian_habit_templates WHERE is_default = true;
  
  RAISE NOTICE 'Total templates: %', template_count;
  RAISE NOTICE 'Default templates: %', default_count;
  
  IF template_count >= 15 AND default_count >= 15 THEN
    RAISE NOTICE '✅ Habit templates validation PASSED';
  ELSE
    RAISE NOTICE '❌ Habit templates validation FAILED';
  END IF;
END $$;

-- =====================================================
-- TEST 4: FUNCTION TESTING
-- =====================================================

-- Test habit streak function
DO $$
DECLARE
  test_habit_id UUID;
  initial_streak INTEGER;
  final_streak INTEGER;
BEGIN
  RAISE NOTICE '=== FUNCTION TESTING ===';
  
  -- Create a test user and habit
  INSERT INTO users (id, email, first_name) 
  VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO christian_habits (id, user_id, name, category, frequency, current_streak)
  VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Test Habit', 'prayer', 'daily', 0)
  ON CONFLICT (id) DO NOTHING;
  
  test_habit_id := '00000000-0000-0000-0000-000000000001';
  
  -- Get initial streak
  SELECT current_streak INTO initial_streak FROM christian_habits WHERE id = test_habit_id;
  
  -- Test streak update function
  PERFORM update_habit_streak(test_habit_id);
  
  -- Get final streak
  SELECT current_streak INTO final_streak FROM christian_habits WHERE id = test_habit_id;
  
  RAISE NOTICE 'Initial streak: %', initial_streak;
  RAISE NOTICE 'Final streak: %', final_streak;
  
  IF final_streak = initial_streak + 1 THEN
    RAISE NOTICE '✅ Streak function test PASSED';
  ELSE
    RAISE NOTICE '❌ Streak function test FAILED';
  END IF;
  
  -- Cleanup
  DELETE FROM christian_habits WHERE id = test_habit_id;
  DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';
END $$;

-- =====================================================
-- TEST 5: DATA INTEGRITY
-- =====================================================

DO $$
DECLARE
  constraint_violations INTEGER := 0;
BEGIN
  RAISE NOTICE '=== DATA INTEGRITY TEST ===';
  
  -- Test habit frequency constraint
  BEGIN
    INSERT INTO christian_habits (user_id, name, category, frequency) 
    VALUES ('00000000-0000-0000-0000-000000000001', 'Test', 'prayer', 'invalid_frequency');
    constraint_violations := constraint_violations + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;
  
  -- Test fasting type constraint
  BEGIN
    INSERT INTO fasting_records (user_id, type, start_time) 
    VALUES ('00000000-0000-0000-0000-000000000001', 'invalid_type', NOW());
    constraint_violations := constraint_violations + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;
  
  -- Test rating constraints
  BEGIN
    INSERT INTO christian_books (user_id, title, rating) 
    VALUES ('00000000-0000-0000-0000-000000000001', 'Test Book', 10);
    constraint_violations := constraint_violations + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;
  
  IF constraint_violations = 0 THEN
    RAISE NOTICE '✅ Data integrity test PASSED';
  ELSE
    RAISE NOTICE '❌ Data integrity test FAILED - % violations', constraint_violations;
  END IF;
END $$;

-- =====================================================
-- TEST 6: PERFORMANCE TESTING
-- =====================================================

DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time INTERVAL;
BEGIN
  RAISE NOTICE '=== PERFORMANCE TEST ===';
  
  -- Test habit query performance
  start_time := clock_timestamp();
  
  PERFORM * FROM christian_habits 
  WHERE user_id = '00000000-0000-0000-0000-000000000001' 
  AND is_active = true;
  
  end_time := clock_timestamp();
  execution_time := end_time - start_time;
  
  RAISE NOTICE 'Habit query time: %', execution_time;
  
  IF execution_time < INTERVAL '100ms' THEN
    RAISE NOTICE '✅ Performance test PASSED';
  ELSE
    RAISE NOTICE '❌ Performance test FAILED - Query too slow';
  END IF;
END $$;

-- =====================================================
-- TEST 7: ANALYTICS VIEWS
-- =====================================================

DO $$
DECLARE
  view_count INTEGER;
  view_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== ANALYTICS VIEWS TEST ===';
  
  -- Check if views exist
  SELECT COUNT(*) INTO view_count
  FROM information_schema.views 
  WHERE table_schema = 'public'
  AND table_name IN ('user_spiritual_growth_summary', 'habit_completion_analytics');
  
  -- Test view execution
  BEGIN
    PERFORM * FROM user_spiritual_growth_summary LIMIT 1;
    view_exists := true;
  EXCEPTION WHEN OTHERS THEN
    view_exists := false;
  END;
  
  RAISE NOTICE 'Analytics views: %', view_count;
  RAISE NOTICE 'Views executable: %', view_exists;
  
  IF view_count = 2 AND view_exists THEN
    RAISE NOTICE '✅ Analytics views test PASSED';
  ELSE
    RAISE NOTICE '❌ Analytics views test FAILED';
  END IF;
END $$;

-- =====================================================
-- TEST 8: TRIGGER TESTING
-- =====================================================

DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  initial_updated_at TIMESTAMP;
  final_updated_at TIMESTAMP;
BEGIN
  RAISE NOTICE '=== TRIGGER TESTING ===';
  
  -- Create test user
  INSERT INTO users (id, email, first_name) 
  VALUES (test_user_id, 'test@example.com', 'Test User')
  ON CONFLICT (id) DO NOTHING;
  
  -- Test updated_at trigger
  SELECT updated_at INTO initial_updated_at FROM users WHERE id = test_user_id;
  
  -- Wait a moment
  PERFORM pg_sleep(0.1);
  
  -- Update user
  UPDATE users SET first_name = 'Updated Test User' WHERE id = test_user_id;
  
  SELECT updated_at INTO final_updated_at FROM users WHERE id = test_user_id;
  
  RAISE NOTICE 'Initial updated_at: %', initial_updated_at;
  RAISE NOTICE 'Final updated_at: %', final_updated_at;
  
  IF final_updated_at > initial_updated_at THEN
    RAISE NOTICE '✅ Trigger test PASSED';
  ELSE
    RAISE NOTICE '❌ Trigger test FAILED';
  END IF;
  
  -- Cleanup
  DELETE FROM users WHERE id = test_user_id;
END $$;

-- =====================================================
-- TEST 9: PERMISSIONS TESTING
-- =====================================================

DO $$
DECLARE
  permission_count INTEGER;
BEGIN
  RAISE NOTICE '=== PERMISSIONS TEST ===';
  
  -- Check if permissions are granted
  SELECT COUNT(*) INTO permission_count
  FROM information_schema.table_privileges 
  WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
  AND privilege_type = 'SELECT';
  
  RAISE NOTICE 'Granted permissions: %', permission_count;
  
  IF permission_count >= 15 THEN
    RAISE NOTICE '✅ Permissions test PASSED';
  ELSE
    RAISE NOTICE '❌ Permissions test FAILED';
  END IF;
END $$;

-- =====================================================
-- TEST 10: COMPREHENSIVE INTEGRATION TEST
-- =====================================================

DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  habit_id UUID;
  completion_id UUID;
  milestone_id UUID;
  success_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== INTEGRATION TEST ===';
  
  -- Create test user
  INSERT INTO users (id, email, first_name, last_name) 
  VALUES (test_user_id, 'integration@test.com', 'Integration', 'Test')
  ON CONFLICT (id) DO NOTHING;
  
  -- Test 1: Create a habit
  INSERT INTO christian_habits (user_id, name, category, frequency)
  VALUES (test_user_id, 'Integration Test Habit', 'prayer', 'daily')
  RETURNING id INTO habit_id;
  
  IF habit_id IS NOT NULL THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Habit creation successful';
  END IF;
  
  -- Test 2: Complete the habit
  INSERT INTO christian_habit_completions (habit_id, user_id, completed_at)
  VALUES (habit_id, test_user_id, NOW())
  RETURNING id INTO completion_id;
  
  IF completion_id IS NOT NULL THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Habit completion successful';
  END IF;
  
  -- Test 3: Create a spiritual milestone
  INSERT INTO spiritual_milestones (user_id, title, type, date_achieved)
  VALUES (test_user_id, 'Integration Test Milestone', 'achievement', CURRENT_DATE)
  RETURNING id INTO milestone_id;
  
  IF milestone_id IS NOT NULL THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Milestone creation successful';
  END IF;
  
  -- Test 4: Create gratitude entry
  INSERT INTO gratitude_entries (user_id, entries, prayer_of_thanksgiving)
  VALUES (test_user_id, ARRAY['Thankful for this test'], 'Thank you, Lord!');
  
  IF FOUND THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Gratitude entry successful';
  END IF;
  
  -- Test 5: Create prayer session
  INSERT INTO prayer_sessions (user_id, duration, topic)
  VALUES (test_user_id, 15, 'Integration Test Prayer');
  
  IF FOUND THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Prayer session successful';
  END IF;
  
  -- Test 6: Test analytics view
  PERFORM * FROM user_spiritual_growth_summary WHERE user_id = test_user_id;
  
  IF FOUND THEN
    success_count := success_count + 1;
    RAISE NOTICE '✅ Analytics view successful';
  END IF;
  
  RAISE NOTICE 'Integration test results: %/6 successful', success_count;
  
  IF success_count = 6 THEN
    RAISE NOTICE '✅ Integration test PASSED';
  ELSE
    RAISE NOTICE '❌ Integration test FAILED';
  END IF;
  
  -- Cleanup
  DELETE FROM christian_habit_completions WHERE habit_id = habit_id;
  DELETE FROM christian_habits WHERE id = habit_id;
  DELETE FROM spiritual_milestones WHERE id = milestone_id;
  DELETE FROM gratitude_entries WHERE user_id = test_user_id;
  DELETE FROM prayer_sessions WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
END $$;

-- =====================================================
-- FINAL TEST SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHRISTIAN HABITS SCHEMA TEST COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tests have been executed.';
  RAISE NOTICE 'Check the results above for any failures.';
  RAISE NOTICE 'Schema is ready for production if all tests passed.';
  RAISE NOTICE '========================================';
END $$;
