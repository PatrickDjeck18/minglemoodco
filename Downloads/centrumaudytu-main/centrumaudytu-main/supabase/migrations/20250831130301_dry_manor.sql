/*
  # Fix exam assignments RLS policies

  1. Security Updates
    - Update RLS policies for exam_assignments table
    - Allow participants to read assignments for their group
    - Allow participants to read their direct assignments
    - Allow admins full access
    - Allow authenticated users to read assignments they need

  2. Changes
    - Drop existing restrictive policies
    - Add new comprehensive policies for reading assignments
    - Ensure participants can see group and individual assignments
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "exam_assignments_admin_all" ON exam_assignments;

-- Allow admins full access
CREATE POLICY "exam_assignments_admin_full_access"
  ON exam_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow participants to read assignments for their group
CREATE POLICY "exam_assignments_group_read"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.group_id = exam_assignments.group_id
    )
  );

-- Allow participants to read their direct assignments
CREATE POLICY "exam_assignments_participant_read"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    participant_id = auth.uid()
  );

-- Allow reading assignments for exam creators
CREATE POLICY "exam_assignments_creator_read"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_assignments.exam_id
      AND exams.created_by = auth.uid()
    )
  );