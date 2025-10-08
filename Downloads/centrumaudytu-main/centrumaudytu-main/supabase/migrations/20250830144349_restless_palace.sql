/*
  # Create invitations table

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `group_id` (uuid, foreign key to groups)
      - `invited_by` (uuid, foreign key to profiles)
      - `token` (text, unique token for invitation link)
      - `status` (text, default 'pending')
      - `expires_at` (timestamp, default 7 days from now)
      - `created_at` (timestamp, default now)

  2. Security
    - Enable RLS on `invitations` table
    - Add policy for admin users to manage invitations
    - Add policy for users to view their own invitations

  3. Indexes
    - Add index on email for faster lookups
    - Add index on token for invitation verification
*/

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin users can manage all invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view invitations sent to their email"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations(email);
CREATE INDEX IF NOT EXISTS invitations_token_idx ON invitations(token);
CREATE INDEX IF NOT EXISTS invitations_group_id_idx ON invitations(group_id);