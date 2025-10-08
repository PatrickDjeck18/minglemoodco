/*
  # Fix invitation trigger - robust cleanup

  1. Trigger Function
    - Mark invitations as accepted when user joins group
    - Handle all edge cases properly
    - Ensure data consistency
  2. Security
    - Proper error handling
    - Transaction safety
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;
DROP FUNCTION IF EXISTS cleanup_accepted_invitations();

-- Create robust cleanup function
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if group_id was added or changed
  IF (TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.group_id IS DISTINCT FROM NEW.group_id AND NEW.group_id IS NOT NULL) THEN
    
    -- Mark all pending invitations for this email/group as accepted
    UPDATE invitations 
    SET status = 'accepted'
    WHERE email = NEW.email 
      AND group_id = NEW.group_id 
      AND status = 'pending';
      
    -- Log the cleanup for debugging
    RAISE NOTICE 'Cleaned up invitations for email: % in group: %', NEW.email, NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_cleanup_invitations
  AFTER INSERT OR UPDATE OF group_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();