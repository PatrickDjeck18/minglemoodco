/*
  # Complete Database Setup for Exam Platform

  This script creates all necessary tables, security policies, and functions
  for the exam platform with groups, users, exams, and attempts.

  1. Tables Created:
     - groups (organizations)
     - profiles (user profiles with roles)
     - exams (exam definitions)
     - questions (exam questions)
     - exam_assignments (who can take which exams)
     - exam_attempts (user exam attempts and results)

  2. Security:
     - Row Level Security enabled on all tables
     - Proper policies for admin and participant access
     - Automatic profile creation trigger

  3. Functions:
     - handle_new_user() - creates profile when user signs up
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Authenticated users can read groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant')),
  group_id uuid REFERENCES groups(id),
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit integer, -- in minutes
  max_attempts integer NOT NULL DEFAULT 3,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on exams
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Admins can manage exams"
  ON exams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read assigned exams"
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

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'open_text')),
  options jsonb, -- for multiple choice questions
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL
);

-- Enable RLS on questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Admins can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read questions for assigned exams"
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

-- Create exam_assignments table
CREATE TABLE IF NOT EXISTS exam_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  CONSTRAINT assignment_target CHECK (
    (participant_id IS NOT NULL AND group_id IS NULL) OR 
    (participant_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Enable RLS on exam_assignments
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;

-- Exam assignments policies
CREATE POLICY "Admins can manage assignments"
  ON exam_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score integer,
  passed boolean DEFAULT false,
  answers jsonb DEFAULT '{}',
  attempt_number integer NOT NULL DEFAULT 1
);

-- Enable RLS on exam_attempts
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Exam attempts policies
CREATE POLICY "Users can manage own attempts"
  ON exam_attempts
  FOR ALL
  TO authenticated
  USING (participant_id = auth.uid());

CREATE POLICY "Admins can read all attempts"
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

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some sample data
INSERT INTO groups (name) VALUES 
  ('Szpital A'),
  ('Firma X'),
  ('Urząd Y')
ON CONFLICT DO NOTHING;