/*
  # Fix exam creation RLS policy

  1. Security Changes
    - Drop existing conflicting policies for exams table
    - Create proper INSERT policy for admins
    - Ensure WITH CHECK clause is properly configured
    - Maintain existing SELECT policies for participants

  2. Policy Details
    - Allow INSERT operations for authenticated users with admin role
    - Use proper WITH CHECK expression for row-level security
    - Verify user role through profiles table join
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "exams_admin_full_access" ON exams;
DROP POLICY IF EXISTS "exams_participant_read" ON exams;
DROP POLICY IF EXISTS "exams_participant_read_access" ON exams;

-- Create comprehensive admin policy for all operations
CREATE POLICY "exams_admin_all_operations"
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

-- Create separate read policy for participants
CREATE POLICY "exams_participant_select"
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