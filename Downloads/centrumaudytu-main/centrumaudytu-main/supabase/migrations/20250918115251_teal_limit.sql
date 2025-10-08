/*
  # Fix invitation cleanup system

  1. Database Functions
    - Improved cleanup function for accepted invitations
    - Better trigger for automatic invitation management

  2. Security
    - Ensure proper cleanup of invitation states
    - Prevent orphaned invitations

  3. Performance
    - Optimized queries for invitation status updates
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;
DROP FUNCTION IF EXISTS cleanup_accepted_invitations();

-- Create improved cleanup function
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user joins a group, mark all their pending invitations for that group as accepted
  IF NEW.group_id IS NOT NULL AND (OLD.group_id IS NULL OR OLD.group_id != NEW.group_id) THEN
    UPDATE invitations 
    SET status = 'accepted'
    WHERE email = NEW.email 
      AND group_id = NEW.group_id 
      AND status = 'pending';
      
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up invitations for user % in group %', NEW.email, NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cleanup
CREATE TRIGGER trigger_cleanup_invitations
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();

-- Also create a function to manually cleanup invitations
CREATE OR REPLACE FUNCTION manual_cleanup_invitations()
RETURNS void AS $$
BEGIN
  -- Mark invitations as accepted for users who are already in groups
  UPDATE invitations 
  SET status = 'accepted'
  WHERE status = 'pending'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.email = invitations.email 
        AND profiles.group_id = invitations.group_id
    );
    
  -- Mark expired invitations
  UPDATE invitations 
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run cleanup now
SELECT manual_cleanup_invitations();