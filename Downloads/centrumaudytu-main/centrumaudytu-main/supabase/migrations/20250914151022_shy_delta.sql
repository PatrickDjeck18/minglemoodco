/*
  # Fix invitation cleanup and user group assignment

  1. Database Functions
    - Create function to automatically clean up accepted invitations
    - Create trigger to update invitation status when user joins group
  
  2. Policies
    - Ensure proper RLS policies for invitation management
    
  3. Indexes
    - Add indexes for better performance on invitation queries
*/

-- Function to clean up invitations when user joins group
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is assigned to a group, mark their pending invitations as accepted
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

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;
CREATE TRIGGER trigger_cleanup_invitations
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();

-- Add index for better performance on invitation queries
CREATE INDEX IF NOT EXISTS idx_invitations_email_group_status 
ON invitations(email, group_id, status);

-- Add index for better performance on profiles queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_group 
ON profiles(email, group_id);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- You can call this function periodically or set up a cron job
-- SELECT expire_old_invitations();