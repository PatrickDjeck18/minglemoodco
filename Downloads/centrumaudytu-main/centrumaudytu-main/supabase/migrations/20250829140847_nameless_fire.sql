/*
  # Add INSERT policy for exams table

  1. Security Changes
    - Add policy to allow admins to create new exams
    - Policy checks if the authenticated user has 'admin' role in profiles table

  2. Policy Details
    - Name: "exams_admin_insert"
    - Operation: INSERT
    - Target: authenticated users with admin role
    - Condition: User must have 'admin' role in profiles table
*/

-- Add INSERT policy for admins to create exams
CREATE POLICY "exams_admin_insert"
  ON exams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );