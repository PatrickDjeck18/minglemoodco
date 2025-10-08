/*
  # Complete cleanup of all users except admin

  1. Delete Operations
    - Remove all auth.users except admin
    - Remove all profiles except admin
    - Clean up all related data

  2. Admin Preservation
    - Keep only adam.homoncik@centrumaudytu.pl
*/

-- First, get the admin user ID
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'adam.homoncik@centrumaudytu.pl';
    
    IF admin_user_id IS NOT NULL THEN
        -- Delete all auth.users except admin
        DELETE FROM auth.users 
        WHERE id != admin_user_id;
        
        RAISE NOTICE 'Cleaned up all users except admin: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found!';
    END IF;
END $$;