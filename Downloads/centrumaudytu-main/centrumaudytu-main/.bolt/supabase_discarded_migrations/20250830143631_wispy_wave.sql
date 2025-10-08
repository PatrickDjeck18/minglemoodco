/*
  # System zaproszeń do grup

  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `email` (text, email zapraszanego użytkownika)
      - `group_id` (uuid, grupa do której zaprasza)
      - `invited_by` (uuid, kto zaprasza)
      - `token` (text, unikalny token zaproszenia)
      - `status` (text, status: pending/accepted/expired)
      - `expires_at` (timestamp, kiedy wygasa)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `invitations` table
    - Add policies for admin access to invitations
    - Add policy for users to accept their own invitations

  3. Functions
    - Function to generate invitation tokens
    - Function to handle invitation acceptance
*/

-- Create invitations table
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

-- Policies for invitations
CREATE POLICY "Admins can manage all invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = uid()));

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record invitations;
  user_profile profiles;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = uid();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User profile not found');
  END IF;

  -- Check if email matches
  IF user_profile.email != invitation_record.email THEN
    RETURN json_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Update user's group
  UPDATE profiles
  SET group_id = invitation_record.group_id
  WHERE id = uid();

  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted'
  WHERE id = invitation_record.id;

  RETURN json_build_object('success', true, 'group_id', invitation_record.group_id);
END;
$$;