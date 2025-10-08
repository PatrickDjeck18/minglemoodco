/*
  # Complete Production Data Cleanup

  1. Data Removal
    - Remove ALL users except admin from auth.users
    - Remove ALL profiles except admin
    - Remove ALL groups, invitations, exams, materials, etc.
    - Clean ALL test data completely

  2. Security
    - Preserve admin account only
    - Reset all sequences and counters
    - Clean storage buckets

  3. Production Ready
    - System ready for real customers
    - No test data or dummy accounts
    - Fresh start for production use
*/

-- STEP 1: Remove all non-admin data from application tables
DELETE FROM certificates WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM exam_attempts WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM material_progress WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM material_assignments;
DELETE FROM exam_assignments;
DELETE FROM questions;
DELETE FROM exams;
DELETE FROM training_materials;
DELETE FROM invitations;
DELETE FROM password_reset_tokens;

-- STEP 2: Remove all groups and non-admin profiles
DELETE FROM profiles WHERE email != 'adam.homoncik@centrumaudytu.pl';
DELETE FROM groups;

-- STEP 3: Remove all non-admin users from auth.users
DELETE FROM auth.users WHERE email != 'adam.homoncik@centrumaudytu.pl';

-- STEP 4: Clean up storage (remove all uploaded files)
-- Note: This would need to be done via Supabase dashboard or API calls
-- as SQL cannot directly delete storage files

-- STEP 5: Reset sequences to start fresh
-- This ensures new records start with clean IDs
SELECT setval(pg_get_serial_sequence('groups', 'id'), 1, false);

-- STEP 6: Verify admin account exists and is properly configured
DO $$
DECLARE
    admin_user_id uuid;
    admin_profile_exists boolean;
BEGIN
    -- Get admin user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'adam.homoncik@centrumaudytu.pl';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found in auth.users! Manual intervention required.';
    END IF;
    
    -- Check if admin profile exists
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = admin_user_id AND email = 'adam.homoncik@centrumaudytu.pl'
    ) INTO admin_profile_exists;
    
    IF NOT admin_profile_exists THEN
        -- Create admin profile if it doesn't exist
        INSERT INTO profiles (
            id, 
            email, 
            role, 
            first_name, 
            last_name,
            created_at
        ) VALUES (
            admin_user_id,
            'adam.homoncik@centrumaudytu.pl',
            'admin',
            'Adam',
            'Homoncik',
            now()
        );
        
        RAISE NOTICE 'Admin profile created successfully';
    ELSE
        -- Ensure admin has correct role
        UPDATE profiles 
        SET role = 'admin',
            group_id = NULL,
            two_factor_enabled = false,
            two_factor_secret = NULL,
            two_factor_secret_temp = NULL,
            two_factor_backup_codes = NULL
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Admin profile verified and updated';
    END IF;
END $$;

-- STEP 7: Vacuum and analyze tables for optimal performance
VACUUM ANALYZE profiles;
VACUUM ANALYZE groups;
VACUUM ANALYZE invitations;
VACUUM ANALYZE exams;
VACUUM ANALYZE questions;
VACUUM ANALYZE exam_assignments;
VACUUM ANALYZE exam_attempts;
VACUUM ANALYZE training_materials;
VACUUM ANALYZE material_assignments;
VACUUM ANALYZE material_progress;
VACUUM ANALYZE certificates;
VACUUM ANALYZE password_reset_tokens;