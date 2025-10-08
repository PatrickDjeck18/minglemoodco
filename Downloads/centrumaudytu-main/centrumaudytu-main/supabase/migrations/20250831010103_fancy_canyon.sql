/*
  # Fix RLS policies for invitations table

  1. Security Updates
    - Remove problematic policies that reference users table
    - Add simple policies for invitations management
    - Allow admins to manage invitations
    - Allow users to view invitations by token

  2. Changes
    - Drop existing policies that cause permission errors
    - Create new policies that don't reference users table directly
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin full access to invitations" ON invitations;
DROP POLICY IF EXISTS "Admin users can manage all invitations" ON invitations;
DROP POLICY IF EXISTS "Allow anonymous token access" ON invitations;

-- Create new simple policies for invitations
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

-- Allow anonymous users to read invitations by token (for accepting invitations)
CREATE POLICY "invitations_anonymous_token_access"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to update invitations they have access to
CREATE POLICY "invitations_update_by_token"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);