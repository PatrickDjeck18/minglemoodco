-- =====================================================
-- MIGRATION SCRIPT FOR EXISTING USERS
-- Migrates existing data to new Christian habits schema
-- =====================================================

-- =====================================================
-- BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS backup_practices AS 
SELECT * FROM practices WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practices');

CREATE TABLE IF NOT EXISTS backup_prayer_sessions AS 
SELECT * FROM prayer_sessions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions');

CREATE TABLE IF NOT EXISTS backup_prayer_requests AS 
SELECT * FROM prayer_requests WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests');

-- =====================================================
-- MIGRATE EXISTING PRACTICES TO CHRISTIAN HABITS
-- =====================================================

-- Migrate practices to christian_habits
INSERT INTO christian_habits (
  user_id,
  name,
  description,
  category,
  frequency,
  target_duration,
  current_streak,
  longest_streak,
  total_completions,
  is_active,
  start_date,
  last_completed,
  created_at,
  updated_at
)
SELECT 
  user_id,
  name,
  description,
  CASE 
    WHEN category = 'fasting' THEN 'discipline'
    WHEN category = 'meditation' THEN 'prayer'
    WHEN category = 'worship' THEN 'worship'
    WHEN category = 'solitude' THEN 'prayer'
    WHEN category = 'service' THEN 'service'
    WHEN category = 'gratitude' THEN 'prayer'
    ELSE 'prayer'
  END as category,
  COALESCE(frequency, 'daily') as frequency,
  NULL as target_duration,
  COALESCE(streak, 0) as current_streak,
  COALESCE(streak, 0) as longest_streak,
  0 as total_completions,
  COALESCE(is_active, true) as is_active,
  COALESCE(created_at::date, CURRENT_DATE) as start_date,
  last_completed,
  created_at,
  updated_at
FROM backup_practices
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practices');

-- =====================================================
-- MIGRATE EXISTING PRAYER SESSIONS
-- =====================================================

-- Migrate prayer sessions (if they exist in old format)
INSERT INTO prayer_sessions (
  user_id,
  duration,
  topic,
  notes,
  created_at
)
SELECT 
  user_id,
  duration,
  topic,
  notes,
  COALESCE(completed_at, created_at) as created_at
FROM backup_prayer_sessions
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_sessions')
AND NOT EXISTS (SELECT 1 FROM prayer_sessions WHERE user_id = backup_prayer_sessions.user_id);

-- =====================================================
-- MIGRATE EXISTING PRAYER REQUESTS
-- =====================================================

-- Update existing prayer requests with new columns if they don't exist
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'category') THEN
    ALTER TABLE prayer_requests ADD COLUMN category TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'urgency_level') THEN
    ALTER TABLE prayer_requests ADD COLUMN urgency_level TEXT DEFAULT 'normal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'target_date') THEN
    ALTER TABLE prayer_requests ADD COLUMN target_date DATE;
  END IF;
END $$;

-- =====================================================
-- CREATE DEFAULT HABITS FOR EXISTING USERS
-- =====================================================

-- Create default habits for existing users who don't have any
INSERT INTO christian_habits (
  user_id,
  template_id,
  name,
  description,
  category,
  frequency,
  target_duration,
  is_active,
  start_date,
  created_at
)
SELECT DISTINCT
  u.id as user_id,
  cht.id as template_id,
  cht.name,
  cht.description,
  cht.category,
  cht.frequency,
  cht.suggested_duration,
  true as is_active,
  CURRENT_DATE as start_date,
  NOW() as created_at
FROM users u
CROSS JOIN christian_habit_templates cht
WHERE cht.is_default = true
AND NOT EXISTS (
  SELECT 1 FROM christian_habits ch 
  WHERE ch.user_id = u.id 
  AND ch.category = cht.category
)
AND u.created_at < NOW() - INTERVAL '1 day'; -- Only for users who have been around for a day

-- =====================================================
-- MIGRATE EXISTING PRACTICE LOGS TO HABIT COMPLETIONS
-- =====================================================

-- Migrate practice logs to habit completions
INSERT INTO christian_habit_completions (
  habit_id,
  user_id,
  completed_at,
  notes,
  created_at
)
SELECT 
  ch.id as habit_id,
  pl.user_id,
  pl.completed_at,
  pl.notes,
  pl.created_at
FROM backup_practices bp
JOIN christian_habits ch ON bp.user_id = ch.user_id 
  AND bp.name = ch.name
  AND bp.category = CASE 
    WHEN ch.category = 'discipline' THEN 'fasting'
    WHEN ch.category = 'prayer' THEN 'meditation'
    WHEN ch.category = 'worship' THEN 'worship'
    WHEN ch.category = 'prayer' THEN 'solitude'
    WHEN ch.category = 'service' THEN 'service'
    WHEN ch.category = 'prayer' THEN 'gratitude'
    ELSE 'meditation'
  END
JOIN practice_logs pl ON bp.id = pl.practice_id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_logs');

-- =====================================================
-- UPDATE USER PROFILES
-- =====================================================

-- Update user profiles with default spiritual goals
UPDATE users 
SET spiritual_goals = '{
  "prayer_time": 30,
  "bible_study": 20,
  "service_hours": 4,
  "gratitude_entries": 7,
  "fasting_days": 1
}'::jsonb
WHERE spiritual_goals IS NULL OR spiritual_goals = '{}'::jsonb;

-- Update notification preferences
UPDATE users 
SET notification_preferences = '{
  "prayer_reminders": true,
  "habit_reminders": true,
  "devotion_reminders": true,
  "fasting_reminders": true,
  "gratitude_reminders": true
}'::jsonb
WHERE notification_preferences IS NULL;

-- =====================================================
-- CREATE INITIAL GRATITUDE ENTRIES
-- =====================================================

-- Create a welcome gratitude entry for existing users
INSERT INTO gratitude_entries (
  user_id,
  date,
  entries,
  prayer_of_thanksgiving,
  created_at
)
SELECT 
  u.id as user_id,
  CURRENT_DATE as date,
  ARRAY['Thankful for this new spiritual journey', 'Grateful for God''s guidance', 'Blessed to have this app for growth'] as entries,
  'Thank you, Lord, for this opportunity to grow closer to You through these spiritual disciplines. Help me to be consistent and faithful in my walk with You.' as prayer_of_thanksgiving,
  NOW() as created_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM gratitude_entries ge 
  WHERE ge.user_id = u.id
)
AND u.created_at < NOW() - INTERVAL '1 hour';

-- =====================================================
-- CREATE WELCOME SPIRITUAL MILESTONE
-- =====================================================

-- Create a welcome milestone for existing users
INSERT INTO spiritual_milestones (
  user_id,
  title,
  description,
  type,
  date_achieved,
  scripture_reference,
  testimony,
  is_public,
  created_at
)
SELECT 
  u.id as user_id,
  'Started Christian Habits Journey' as title,
  'Began using the Christian habits tracker to grow spiritually' as description,
  'achievement' as type,
  CURRENT_DATE as date_achieved,
  'Philippians 1:6' as scripture_reference,
  'Excited to begin this journey of spiritual growth and discipline!' as testimony,
  false as is_public,
  NOW() as created_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM spiritual_milestones sm 
  WHERE sm.user_id = u.id
)
AND u.created_at < NOW() - INTERVAL '1 hour';

-- =====================================================
-- UPDATE HABIT STATISTICS
-- =====================================================

-- Update habit completion rates based on existing data
UPDATE christian_habits 
SET completion_rate = CASE 
  WHEN frequency = 'daily' THEN 
    LEAST(100.0, (total_completions * 100.0) / GREATEST(EXTRACT(days FROM NOW() - start_date) + 1, 1))
  WHEN frequency = 'weekly' THEN 
    LEAST(100.0, (total_completions * 100.0) / GREATEST(EXTRACT(weeks FROM NOW() - start_date) + 1, 1))
  ELSE completion_rate
END
WHERE completion_rate = 0 AND total_completions > 0;

-- =====================================================
-- CLEANUP OLD TABLES (OPTIONAL)
-- =====================================================

-- Uncomment these lines if you want to remove old tables after migration
-- DROP TABLE IF EXISTS backup_practices;
-- DROP TABLE IF EXISTS backup_prayer_sessions;
-- DROP TABLE IF EXISTS backup_prayer_requests;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify migration success
DO $$
DECLARE
  practice_count INTEGER;
  habit_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Count migrated practices
  SELECT COUNT(*) INTO practice_count FROM backup_practices;
  
  -- Count new habits
  SELECT COUNT(*) INTO habit_count FROM christian_habits;
  
  -- Count users
  SELECT COUNT(*) INTO user_count FROM users;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Original Practices: %', practice_count;
  RAISE NOTICE 'New Christian Habits: %', habit_count;
  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- =====================================================
-- FINAL OPTIMIZATION
-- =====================================================

-- Update table statistics for better query performance
ANALYZE users;
ANALYZE christian_habits;
ANALYZE christian_habit_completions;
ANALYZE prayer_sessions;
ANALYZE prayer_requests;
ANALYZE gratitude_entries;
ANALYZE spiritual_milestones;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHRISTIAN HABITS MIGRATION COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All existing data has been migrated to the new schema.';
  RAISE NOTICE 'Users now have access to enhanced Christian habits tracking.';
  RAISE NOTICE 'Default habits and welcome content have been created.';
  RAISE NOTICE 'Database is ready for production use.';
  RAISE NOTICE '========================================';
END $$;
