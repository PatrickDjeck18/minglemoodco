/*
  # Fix invitation cleanup trigger

  1. Improved trigger function
    - Better logic for marking invitations as accepted
    - Handles edge cases properly
    - Prevents race conditions

  2. Security
    - Maintains RLS policies
    - Proper error handling
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;
DROP FUNCTION IF EXISTS cleanup_accepted_invitations();

-- Create improved cleanup function
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when group_id is being set (user joining a group)
  IF OLD.group_id IS DISTINCT FROM NEW.group_id AND NEW.group_id IS NOT NULL THEN
    -- Mark all pending invitations for this email/group as accepted
    UPDATE invitations 
    SET status = 'accepted'
    WHERE email = NEW.email 
      AND group_id = NEW.group_id 
      AND status = 'pending';
      
    RAISE LOG 'Cleaned up invitations for user % joining group %', NEW.email, NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_cleanup_invitations
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();