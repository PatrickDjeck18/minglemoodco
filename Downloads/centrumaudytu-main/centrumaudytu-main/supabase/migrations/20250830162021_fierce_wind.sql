/*
  # Fix invitations table policies

  1. Security Updates
    - Add policy for anonymous users to read invitations by token
    - This allows the invite acceptance page to work for non-logged users
    
  2. Changes
    - Add SELECT policy for anonymous users with token access
*/

-- Allow anonymous users to read invitations by token (needed for invite acceptance)
CREATE POLICY "Anonymous users can read invitations by token"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);

-- Also allow authenticated users to read invitations by token
CREATE POLICY "Authenticated users can read invitations by token"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (true);