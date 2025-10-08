/*
  # Fix RLS policies for exams table - Admin access

  1. Security Changes
    - Drop existing restrictive policies
    - Add comprehensive admin policy for all operations
    - Add participant read-only policy
    - Ensure admins can INSERT, SELECT, UPDATE, DELETE exams

  2. Policy Details
    - Admin policy: Full access to all exam operations
    - Participant policy: Read-only access to exams
*/

-- Drop existing policies that might be blocking admin access
DROP POLICY IF EXISTS "exams_admin_full_access" ON exams;
DROP POLICY IF EXISTS "exams_participants_read_only" ON exams;
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
DROP POLICY IF EXISTS "exams_participants_read" ON exams;

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