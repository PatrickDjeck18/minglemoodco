/*
  # Fix RLS INSERT policy for exams table

  1. Security Changes
    - Drop existing restrictive policy
    - Create new INSERT policy allowing admins to create exams
    - Ensure created_by field is properly set to current user
*/

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "exams_admin_all_operations" ON exams;

-- Create separate policies for better control
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
    AND created_by = auth.uid()
  );

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