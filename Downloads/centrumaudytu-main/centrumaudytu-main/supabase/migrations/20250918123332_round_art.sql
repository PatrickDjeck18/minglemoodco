/*
  # Clean all data and keep only admin

  1. Data Cleanup
    - Remove all certificates
    - Remove all exam attempts  
    - Remove all exam assignments
    - Remove all material assignments
    - Remove all material progress
    - Remove all questions
    - Remove all exams
    - Remove all training materials
    - Remove all invitations
    - Remove all password reset tokens
    - Remove all participant profiles
    - Remove all groups
  2. Keep Admin
    - Keep only admin profile (adam.homoncik@centrumaudytu.pl)
*/

-- Clean all data in correct order (respecting foreign keys)
DELETE FROM certificates;
DELETE FROM exam_attempts;
DELETE FROM exam_assignments;
DELETE FROM material_assignments;
DELETE FROM material_progress;
DELETE FROM questions;
DELETE FROM exams;
DELETE FROM training_materials;
DELETE FROM invitations;
DELETE FROM password_reset_tokens;

-- Remove all participant profiles (keep only admin)
DELETE FROM profiles WHERE role = 'participant';

-- Remove all groups
DELETE FROM groups;

-- Reset sequences if needed
SELECT setval(pg_get_serial_sequence('groups', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('exams', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('training_materials', 'id'), 1, false);