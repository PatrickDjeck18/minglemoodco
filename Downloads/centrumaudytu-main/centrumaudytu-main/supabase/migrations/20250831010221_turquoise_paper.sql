/*
  # Fix RLS policies for exams table

  1. Security Changes
    - Remove policies referencing non-existent 'users' table
    - Add correct policies using 'profiles' table
    - Allow admins to manage exams
    - Allow participants to read assigned exams

  2. Notes
    - Fixes "permission denied for table users" error
    - Uses profiles.role instead of users table
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable insert for admin users" ON exams;
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
DROP POLICY IF EXISTS "exams_participants_read_assigned" ON exams;

-- Create correct policies for exams table
CREATE POLICY "exams_admin_all"
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

CREATE POLICY "exams_participants_read_assigned"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = exams.id 
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );