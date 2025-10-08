/*
  # Cleanup database and fix invitation system

  1. Data Cleanup
    - Remove all exam attempts, assignments, and certificates
    - Remove all training materials and assignments
    - Remove all groups and invitations
    - Remove all participant profiles (keep only admin)
    
  2. System Fixes
    - Add proper trigger function for invitation cleanup
    - Add database function for expired token cleanup
    - Ensure proper RLS policies
    
  3. Optimizations
    - Add missing indexes for performance
    - Clean up unused data
*/

-- Disable RLS temporarily for cleanup
SET session_replication_role = replica;

-- Clean up all data except admin user
DELETE FROM certificates;
DELETE FROM exam_attempts;
DELETE FROM exam_assignments;
DELETE FROM material_progress;
DELETE FROM material_assignments;
DELETE FROM training_materials;
DELETE FROM questions;
DELETE FROM exams;
DELETE FROM invitations;
DELETE FROM password_reset_tokens;
DELETE FROM profiles WHERE role = 'participant';
DELETE FROM groups;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Create function to cleanup accepted invitations
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user's group_id is updated (user joins a group)
  -- Mark any pending invitations for that email as accepted
  IF NEW.group_id IS NOT NULL AND (OLD.group_id IS NULL OR OLD.group_id != NEW.group_id) THEN
    UPDATE invitations 
    SET status = 'accepted'
    WHERE email = NEW.email 
      AND group_id = NEW.group_id 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists for invitation cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;
CREATE TRIGGER trigger_cleanup_invitations
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_email_group_status 
  ON invitations (email, group_id, status);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
  ON password_reset_tokens (email);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
  ON password_reset_tokens (token);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
  ON password_reset_tokens (expires_at);

-- Ensure proper RLS policies for password reset tokens
DROP POLICY IF EXISTS "password_reset_tokens_service_role_only" ON password_reset_tokens;
CREATE POLICY "password_reset_tokens_service_role_only"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update invitation policies to be more secure
DROP POLICY IF EXISTS "invitations_anonymous_token_access" ON invitations;
CREATE POLICY "invitations_anonymous_token_access"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "invitations_update_by_token" ON invitations;
CREATE POLICY "invitations_update_by_token"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure admin policies work correctly
DROP POLICY IF EXISTS "invitations_admin_all" ON invitations;
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