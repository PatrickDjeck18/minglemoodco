/*
  # Fix RLS policy for exams table

  1. Security Updates
    - Update INSERT policy for exams table to allow admin users
    - Ensure admins can create new exams
    - Fix row-level security violation

  2. Changes
    - Modify existing INSERT policy to properly check admin role
    - Ensure policy allows authenticated admin users to insert exams
*/

-- Drop existing problematic policy if it exists
DROP POLICY IF EXISTS "exams_admin_all_operations" ON exams;

-- Create separate policies for better control
CREATE POLICY "exams_admin_select"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exams_admin_insert"
  ON exams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exams_admin_update"
  ON exams
  FOR UPDATE
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

CREATE POLICY "exams_admin_delete"
  ON exams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Keep participant read access
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