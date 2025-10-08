/*
  # Fix all RLS policies to use profiles table instead of users

  1. Tables Updated
    - `exams` - Fix admin access policies
    - `questions` - Fix admin access policies  
    - `exam_assignments` - Fix admin access policies
    - `invitations` - Fix admin access policies

  2. Security Changes
    - Remove all references to non-existent `users` table
    - Use `profiles` table for role checking
    - Ensure authenticated users can access their data
    - Maintain admin privileges for all operations

  3. Key Changes
    - Admin role checking via `profiles.role = 'admin'`
    - Participant access to assigned exams
    - Proper invitation handling
*/

-- Fix exams table policies
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
DROP POLICY IF EXISTS "exams_participants_read_assigned" ON exams;

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

-- Fix questions table policies
DROP POLICY IF EXISTS "questions_admin_all" ON questions;
DROP POLICY IF EXISTS "questions_participants_read_assigned" ON questions;

CREATE POLICY "questions_admin_all" 
  ON questions 
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

CREATE POLICY "questions_participants_read_assigned" 
  ON questions 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = questions.exam_id 
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );

-- Fix exam_assignments table policies
DROP POLICY IF EXISTS "exam_assignments_admin_all" ON exam_assignments;

CREATE POLICY "exam_assignments_admin_all" 
  ON exam_assignments 
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

-- Fix invitations table policies
DROP POLICY IF EXISTS "invitations_admin_all" ON invitations;
DROP POLICY IF EXISTS "invitations_anonymous_token_access" ON invitations;
DROP POLICY IF EXISTS "invitations_update_by_token" ON invitations;

CREATE POLICY "invitations_admin_all" 
  ON invitations 
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

CREATE POLICY "invitations_anonymous_token_access" 
  ON invitations 
  FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "invitations_update_by_token" 
  ON invitations 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);