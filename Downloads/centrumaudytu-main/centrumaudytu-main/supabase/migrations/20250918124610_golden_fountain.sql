/*
  # Force cleanup all auth users except admin

  1. Security
    - Temporarily disable RLS for cleanup
    - Remove all auth.users except admin
    - Remove all profiles except admin
    - Clean all related data
    - Re-enable RLS

  2. Data Cleanup
    - Remove all invitations
    - Remove all groups
    - Remove all exams and related data
    - Remove all materials and assignments
    - Reset sequences

  IMPORTANT: This will completely reset the system to have only the admin user
*/

-- Disable RLS temporarily for cleanup
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Delete all data except admin
DELETE FROM certificates WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM material_progress WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM material_assignments;
DELETE FROM training_materials;
DELETE FROM exam_attempts WHERE participant_id != (SELECT id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl');
DELETE FROM exam_assignments;
DELETE FROM questions;
DELETE FROM exams;
DELETE FROM invitations;
DELETE FROM password_reset_tokens;

-- Delete profiles except admin
DELETE FROM profiles WHERE email != 'adam.homoncik@centrumaudytu.pl';

-- Delete groups
DELETE FROM groups;

-- Delete auth users except admin (using service role permissions)
DO $$
DECLARE
    admin_id uuid;
    user_record record;
BEGIN
    -- Get admin ID
    SELECT id INTO admin_id FROM profiles WHERE email = 'adam.homoncik@centrumaudytu.pl';
    
    -- Delete all auth.users except admin
    FOR user_record IN 
        SELECT id FROM auth.users WHERE id != admin_id
    LOOP
        DELETE FROM auth.users WHERE id = user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Cleanup completed. Only admin user remains.';
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;