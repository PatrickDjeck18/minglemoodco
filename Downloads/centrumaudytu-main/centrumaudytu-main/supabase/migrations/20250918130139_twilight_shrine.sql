/*
  # Fix RLS policies for exams table

  1. Security Changes
    - Drop existing restrictive policies
    - Create new policies that allow admin operations
    - Ensure admins can INSERT, SELECT, UPDATE, DELETE
    - Ensure participants can only SELECT

  2. Policy Details
    - `exams_admin_full_access`: Admins can do everything
    - `exams_participants_read_only`: Participants can only read
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "exams_admin_all_operations" ON exams;
DROP POLICY IF EXISTS "exams_participant_select" ON exams;

-- Create comprehensive admin policy for all operations
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

-- Create participant read-only policy
CREATE POLICY "exams_participants_read_only"
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