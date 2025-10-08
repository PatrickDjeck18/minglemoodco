/*
  # Fix exam creation RLS policy

  1. Security Changes
    - Remove conflicting INSERT policy for exams table
    - Update existing admin policy to properly handle INSERT operations
    - Ensure admins can create exams without RLS violations

  This migration fixes the "new row violates row-level security policy" error
  when admins try to create new exams.
*/

-- Drop the existing conflicting INSERT policy
DROP POLICY IF EXISTS "Admins can create exams" ON exams;

-- Update the existing admin policy to handle all operations including INSERT
DROP POLICY IF EXISTS "exams_admin_access" ON exams;

CREATE POLICY "exams_admin_full_access"
  ON exams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure participant read access is maintained
CREATE POLICY "exams_participant_read_access"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'participant'
    )
  );