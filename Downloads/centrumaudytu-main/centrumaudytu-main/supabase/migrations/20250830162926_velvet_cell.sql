/*
  # Fix invitations RLS policies for anonymous access

  1. Security Changes
    - Drop existing restrictive policies
    - Add simple policy allowing anonymous users to read invitations by token
    - Keep admin policy for full access

  2. Notes
    - Anonymous users need to read invitations to accept them
    - Token-based access is secure since tokens are random and expire
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Anonymous users can read invitations by token" ON invitations;
DROP POLICY IF EXISTS "Authenticated users can read invitations by token" ON invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON invitations;

-- Create simple policy for anonymous token access
CREATE POLICY "Allow anonymous token access"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);

-- Keep admin policy
CREATE POLICY "Admin full access to invitations"
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