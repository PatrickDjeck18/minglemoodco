/*
  # Fix infinite recursion in exams RLS policies

  1. Problem
    - Infinite recursion detected in policy for relation "exams"
    - Policies are creating circular dependencies

  2. Solution
    - Drop existing problematic policies
    - Create new, simplified policies without recursion
    - Ensure policies don't reference the same table they're protecting

  3. New Policies
    - Admin full access policy
    - Participant read access through exam_assignments (simplified)
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
DROP POLICY IF EXISTS "exams_participants_read" ON exams;

-- Create new, simplified policies without recursion
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

CREATE POLICY "exams_participant_read_assigned"
  ON exams
  FOR SELECT
  TO authenticated
  USING (
    -- Allow reading if exam is assigned to user directly
    EXISTS (
      SELECT 1 FROM exam_assignments 
      WHERE exam_assignments.exam_id = exams.id 
      AND exam_assignments.participant_id = auth.uid()
    )
    OR
    -- Allow reading if exam is assigned to user's group
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = exams.id 
      AND ea.group_id = p.group_id
    )
  );