-- Database Setup for Exam Platform
-- Run this SQL in your Supabase SQL Editor

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
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant')),
  group_id uuid REFERENCES groups(id),
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit integer, -- in minutes
  max_attempts integer NOT NULL DEFAULT 3,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'open_text')),
  options jsonb,
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL
);

-- Create exam_assignments table
CREATE TABLE IF NOT EXISTS exam_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id) NOT NULL,
  CONSTRAINT assignment_target CHECK (
    (participant_id IS NOT NULL AND group_id IS NULL) OR
    (participant_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score integer,
  passed boolean DEFAULT false,
  answers jsonb DEFAULT '{}',
  attempt_number integer NOT NULL DEFAULT 1
);

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for groups
CREATE POLICY "Authenticated users can read groups" ON groups
  FOR SELECT TO authenticated
  USING (true);

-- RLS Policies for exams
CREATE POLICY "Admins can manage exams" ON exams
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read assigned exams" ON exams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = exams.id
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );

-- RLS Policies for questions
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Participants can read questions for assigned exams" ON questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_assignments ea
      JOIN profiles p ON p.id = auth.uid()
      WHERE ea.exam_id = questions.exam_id
      AND (ea.participant_id = auth.uid() OR ea.group_id = p.group_id)
    )
  );

-- RLS Policies for exam_assignments
CREATE POLICY "Admins can manage assignments" ON exam_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for exam_attempts
CREATE POLICY "Users can manage own attempts" ON exam_attempts
  FOR ALL TO authenticated
  USING (participant_id = auth.uid());

CREATE POLICY "Admins can read all attempts" ON exam_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'participant')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();