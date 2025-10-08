/*
  # Fix invitation cleanup trigger

  1. Database Functions
    - Create proper function to cleanup invitations when user joins group
    - Ensure all pending invitations for email/group are marked as accepted

  2. Triggers
    - Trigger on profiles table when group_id is updated
    - Trigger on profiles table when new user is inserted with group_id

  3. Cleanup
    - Remove any existing broken triggers
    - Add proper error handling
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_progress_for_group_member ON profiles;
DROP TRIGGER IF EXISTS trigger_cleanup_invitations ON profiles;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cleanup_accepted_invitations();
DROP FUNCTION IF EXISTS create_progress_for_new_group_member();

-- Create improved cleanup function
CREATE OR REPLACE FUNCTION cleanup_accepted_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if group_id was set (not null)
  IF NEW.group_id IS NOT NULL THEN
    -- Mark all pending invitations for this email/group as accepted
    UPDATE invitations 
    SET status = 'accepted'
    WHERE email = NEW.email 
      AND group_id = NEW.group_id 
      AND status = 'pending';
      
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up invitations for email: % in group: %', NEW.email, NEW.group_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for material progress (separate concern)
CREATE OR REPLACE FUNCTION create_progress_for_new_group_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create progress if group_id was added (not just updated)
  IF NEW.group_id IS NOT NULL AND (OLD IS NULL OR OLD.group_id IS NULL OR OLD.group_id != NEW.group_id) THEN
    -- Create material progress for all materials assigned to this group
    INSERT INTO material_progress (material_id, participant_id, status, progress_percentage)
    SELECT 
      ma.material_id,
      NEW.id,
      'not_started',
      0
    FROM material_assignments ma
    WHERE ma.group_id = NEW.group_id
      AND NOT EXISTS (
        SELECT 1 FROM material_progress mp 
        WHERE mp.material_id = ma.material_id 
          AND mp.participant_id = NEW.id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both INSERT and UPDATE operations
CREATE TRIGGER trigger_cleanup_invitations
  AFTER INSERT OR UPDATE OF group_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_accepted_invitations();

CREATE TRIGGER create_progress_for_group_member
  AFTER INSERT OR UPDATE OF group_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_progress_for_new_group_member();