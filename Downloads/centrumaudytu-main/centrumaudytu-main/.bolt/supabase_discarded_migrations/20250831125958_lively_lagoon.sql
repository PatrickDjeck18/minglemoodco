/*
  # Fix RLS policies for exam assignments

  1. Security Updates
    - Add policy for participants to read their assigned exams
    - Add policy for participants to read exams assigned to their group
    - Fix profiles RLS to allow group members to see each other

  2. Changes
    - New RLS policy: exam_assignments_participants_read
    - Updated profiles RLS policy for group visibility
*/

-- Allow participants to read exam assignments for themselves or their group
CREATE POLICY "exam_assignments_participants_read"
  ON exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    participant_id = auth.uid() OR 
    group_id IN (
      SELECT group_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Allow participants to read profiles in their group
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    uid() = id OR 
    (SELECT role FROM profiles WHERE id = uid()) = 'admin' OR
    group_id IN (
      SELECT group_id 
      FROM profiles 
      WHERE id = auth.uid() AND group_id IS NOT NULL
    )
  );