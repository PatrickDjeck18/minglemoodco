/*
  # Fix RLS policies for user registration

  1. Security Updates
    - Add INSERT policy for authenticated users to create their own profiles
    - Add UPDATE policy for authenticated users to update their own profiles
    - Ensure users can register and be assigned to groups properly

  2. Changes
    - Allow authenticated users to insert profiles where id matches auth.uid()
    - Allow authenticated users to update their own profiles
    - Keep existing read policy intact
*/

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile (for group assignments)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE TO authenticated
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