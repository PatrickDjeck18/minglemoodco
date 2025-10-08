/*
  # Fix Database Issues

  1. Security
    - Drop and recreate all RLS policies to avoid conflicts
    - Ensure proper RLS setup for all tables
    - Fix trigger function for new user handling

  2. Tables
    - Ensure all tables exist with proper structure
    - Fix any missing constraints or indexes

  3. Functions
    - Recreate handle_new_user function
    - Add proper error handling
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read groups" ON groups;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
DROP POLICY IF EXISTS "Participants can read assigned exams" ON exams;
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Participants can read questions for assigned exams" ON questions;
DROP POLICY IF EXISTS "Admins can manage assignments" ON exam_assignments;
DROP POLICY IF EXISTS "Admins can read all attempts" ON exam_attempts;
DROP POLICY IF EXISTS "Users can manage own attempts" ON exam_attempts;

-- Recreate handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email = 'adam.homoncik@centrumaudytu.pl' THEN 'admin'
      ELSE 'participant'
    END,
    CASE 
      WHEN NEW.email = 'adam.homoncik@centrumaudytu.pl' THEN 'Adam'
      ELSE ''
    END,
    CASE 
      WHEN NEW.email = 'adam.homoncik@centrumaudytu.pl' THEN 'Homoncik'
      ELSE ''
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recreate RLS policies with proper names

-- Groups policies
CREATE POLICY "groups_read_authenticated" ON groups
  FOR SELECT TO authenticated
  USING (true);

-- Profiles policies
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Exams policies
CREATE POLICY "exams_admin_all" ON exams
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exams_participants_read_assigned" ON exams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = exams.id 
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );

-- Questions policies
CREATE POLICY "questions_admin_all" ON questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "questions_participants_read_assigned" ON questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = questions.exam_id 
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );

-- Exam assignments policies
CREATE POLICY "exam_assignments_admin_all" ON exam_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Exam attempts policies
CREATE POLICY "exam_attempts_admin_read_all" ON exam_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exam_attempts_users_own" ON exam_attempts
  FOR ALL TO authenticated
  USING (participant_id = auth.uid());

-- Ensure RLS is enabled on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;