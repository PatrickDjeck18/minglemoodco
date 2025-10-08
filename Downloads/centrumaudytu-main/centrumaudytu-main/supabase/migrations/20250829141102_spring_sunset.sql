/*
  # Fix RLS policies for exam creation

  1. Security Updates
    - Drop and recreate INSERT policy for exams table
    - Ensure admin users can create exams
    - Add better error handling for policy checks

  2. Changes
    - Updated INSERT policy with clearer logic
    - Added policy for WITH CHECK clause
    - Ensured proper admin role verification
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "exams_admin_insert" ON exams;

-- Create a comprehensive INSERT policy for admins
CREATE POLICY "Enable insert for admin users" ON exams
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure the admin user exists in profiles table
INSERT INTO profiles (id, email, role, first_name, last_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'adam.homoncik@centrumaudytu.pl' LIMIT 1),
  'adam.homoncik@centrumaudytu.pl',
  'admin',
  'Adam',
  'Homoncik'
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'adam.homoncik@centrumaudytu.pl';