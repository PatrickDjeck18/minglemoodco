/*
  # Complete Password Reset System

  1. New Tables
    - `password_reset_tokens` table for managing reset tokens
      - `id` (uuid, primary key)
      - `email` (text, user email)
      - `token` (text, unique reset token)
      - `expires_at` (timestamp, token expiration)
      - `used` (boolean, whether token was used)
      - `created_at` (timestamp, creation time)

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - Add policy for service role only access
    - Add indexes for performance
    - Add cleanup function for expired tokens

  3. Functions
    - `cleanup_expired_reset_tokens` - removes expired tokens
*/

-- Create password reset tokens table if not exists
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'password_reset_tokens' 
    AND policyname = 'password_reset_tokens_service_role_only'
  ) THEN
    CREATE POLICY "password_reset_tokens_service_role_only"
      ON password_reset_tokens
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;