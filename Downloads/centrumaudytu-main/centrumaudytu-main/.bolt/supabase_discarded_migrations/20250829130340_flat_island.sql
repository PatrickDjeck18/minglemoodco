/*
  # Create Exam Platform Schema

  1. New Tables
    - `groups` - Organizations/companies that use the platform
      - `id` (uuid, primary key)
      - `name` (text) - Group name like "Szpital A", "Firma X"
      - `created_at` (timestamp)
    
    - `profiles` - User profiles with roles
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `role` (text) - 'admin' or 'participant'
      - `group_id` (uuid, references groups) - null for central admins
      - `first_name` (text)
      - `last_name` (text)
      - `created_at` (timestamp)
    
    - `exams` - Exams created by admins
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `passing_score` (integer) - percentage needed to pass
      - `time_limit` (integer) - minutes, null if no limit
      - `max_attempts` (integer) - default 2
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `questions` - Questions for exams
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `question_text` (text)
      - `question_type` (text) - 'multiple_choice', 'open_text'
      - `options` (jsonb) - for multiple choice questions
      - `correct_answer` (text)
      - `points` (integer)
      - `order_index` (integer)
    
    - `exam_assignments` - Which exams are assigned to which participants
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `participant_id` (uuid, references profiles)
      - `group_id` (uuid, references groups)
      - `assigned_at` (timestamp)
      - `assigned_by` (uuid, references profiles)
    
    - `exam_attempts` - Track exam attempts and results
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `participant_id` (uuid, references profiles)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `score` (integer) - percentage score
      - `passed` (boolean)
      - `answers` (jsonb) - participant's answers
      - `attempt_number` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Admins can manage their groups
    - Participants can only see their assigned content
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'participant')),
  group_id uuid REFERENCES groups(id),
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  passing_score integer NOT NULL DEFAULT 70,
  time_limit integer, -- minutes
  max_attempts integer NOT NULL DEFAULT 2,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'open_text')),
  options jsonb, -- for multiple choice: {"A": "Answer 1", "B": "Answer 2", ...}
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL
);

-- Create exam assignments table
CREATE TABLE IF NOT EXISTS exam_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id) NOT NULL,
  CONSTRAINT assignment_target CHECK (
    (participant_id IS NOT NULL AND group_id IS NULL) OR 
    (participant_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Create exam attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score integer, -- percentage
  passed boolean DEFAULT false,
  answers jsonb DEFAULT '{}',
  attempt_number integer NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Groups policies
CREATE POLICY "Admins can read groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Exams policies
CREATE POLICY "Admins can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read assigned exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = exams.id
      AND (
        ea.participant_id = auth.uid() OR
        ea.group_id = p.group_id
      )
    )
  );

-- Questions policies
CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read questions for assigned exams"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = questions.exam_id
      AND (
        ea.participant_id = auth.uid() OR
        ea.group_id = p.group_id
      )
    )
  );

-- Exam assignments policies
CREATE POLICY "Admins can manage assignments"
  ON exam_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read their assignments"
  ON exam_assignments FOR SELECT
  TO authenticated
  USING (
    participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.group_id = exam_assignments.group_id
    )
  );

-- Exam attempts policies
CREATE POLICY "Participants can manage own attempts"
  ON exam_attempts FOR ALL
  TO authenticated
  USING (participant_id = auth.uid());

CREATE POLICY "Admins can read all attempts"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert admin user profile
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'adam.homoncik@centrumaudytu.pl' LIMIT 1),
  'adam.homoncik@centrumaudytu.pl',
  'admin',
  'Adam',
  'Homoncik'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  first_name = 'Adam',
  last_name = 'Homoncik';

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    'participant', -- default role
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();