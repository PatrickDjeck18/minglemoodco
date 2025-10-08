/*
  # Add Two-Factor Authentication Support

  1. New Columns
    - `two_factor_enabled` (boolean) - whether 2FA is enabled for user
    - `two_factor_secret` (text) - encrypted TOTP secret key
    - `two_factor_secret_temp` (text) - temporary secret during setup
    - `two_factor_backup_codes` (text[]) - array of backup codes

  2. Security
    - All columns are nullable and default to disabled state
    - Secrets are stored securely and only accessible by the user
    - Backup codes are one-time use only

  3. Changes
    - Added columns to profiles table for 2FA functionality
    - No breaking changes to existing functionality
*/

-- Add 2FA columns to profiles table
DO $$
BEGIN
  -- Add two_factor_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_enabled boolean DEFAULT false;
  END IF;

  -- Add two_factor_secret column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_secret'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_secret text;
  END IF;

  -- Add two_factor_secret_temp column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_secret_temp'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_secret_temp text;
  END IF;

  -- Add two_factor_backup_codes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'two_factor_backup_codes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN two_factor_backup_codes text[];
  END IF;
END $$;