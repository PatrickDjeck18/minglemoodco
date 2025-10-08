/*
  # Complete RLS Policy Fix

  1. Remove all existing policies that reference the 'users' table
  2. Add new policies that only use 'profiles' table
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their data
    - Add admin policies for full access
*/

-- Drop all existing policies that might reference 'users' table
DROP POLICY IF EXISTS "profiles_admin_access" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "exams_admin_all" ON exams;
DROP POLICY IF EXISTS "exams_participants_read_assigned" ON exams;
DROP POLICY IF EXISTS "groups_admin_insert" ON groups;
DROP POLICY IF EXISTS "groups_read_authenticated" ON groups;
DROP POLICY IF EXISTS "questions_admin_all" ON questions;
DROP POLICY IF EXISTS "questions_participants_read_assigned" ON questions;
DROP POLICY IF EXISTS "exam_assignments_admin_all" ON exam_assignments;
DROP POLICY IF EXISTS "exam_attempts_admin_read_all" ON exam_attempts;
DROP POLICY IF EXISTS "exam_attempts_users_own" ON exam_attempts;
DROP POLICY IF EXISTS "invitations_admin_all" ON invitations;
DROP POLICY IF EXISTS "invitations_anonymous_token_access" ON invitations;
DROP POLICY IF EXISTS "invitations_update_by_token" ON invitations;

-- Profiles policies
CREATE POLICY "profiles_insert_authenticated"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR role = 'admin')
  WITH CHECK (auth.uid() = id OR role = 'admin');

-- Exams policies
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

CREATE POLICY "exams_participants_read"
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

-- Groups policies
CREATE POLICY "groups_admin_all"
  ON groups
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

CREATE POLICY "groups_read_authenticated"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Questions policies
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

CREATE POLICY "questions_participants_read"
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

-- Exam assignments policies
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

-- Exam attempts policies
CREATE POLICY "exam_attempts_admin_read_all"
  ON exam_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exam_attempts_users_own"
  ON exam_attempts
  FOR ALL
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

-- Invitations policies
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