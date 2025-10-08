/*
  # Fix infinite recursion in exams RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "exams"
    - Policies are creating circular dependencies

  2. Solution
    - Drop all existing policies on exams table
    - Create new simplified policies without recursive references
    - Use direct user role checks instead of complex subqueries

  3. Security
    - Admin users can do everything
    - Participants can only read exams (no complex assignment checks in policy)
*/

-- Drop all existing policies on exams table
DROP POLICY IF EXISTS "exams_admin_full_access" ON exams;
DROP POLICY IF EXISTS "exams_participant_read_assigned" ON exams;

-- Create simple, non-recursive policies
CREATE POLICY "exams_admin_access"
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

CREATE POLICY "exams_participant_read"
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