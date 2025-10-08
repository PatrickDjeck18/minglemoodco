/*
  # Add INSERT policy for groups table

  1. Security Changes
    - Add INSERT policy for groups table
    - Allow only authenticated users with 'admin' role to create groups
    - Policy checks user's role from profiles table

  2. Notes
    - This resolves the RLS violation when admins try to create groups
    - Only admin users can create new groups
*/

-- Add INSERT policy for groups table
CREATE POLICY "groups_admin_insert"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );