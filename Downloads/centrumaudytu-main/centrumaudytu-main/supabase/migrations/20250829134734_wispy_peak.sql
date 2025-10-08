/*
  # Fix profiles table and authentication

  1. Security
    - Drop and recreate all RLS policies to avoid conflicts
    - Create proper trigger function for profile creation
    - Set up admin user with correct role

  2. Profile Management
    - Ensure profiles table has correct structure
    - Create trigger to automatically create profiles for new users
    - Set admin role for specific email
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email = 'adam.homoncik@centrumaudytu.pl' THEN 'admin'
      ELSE 'participant'
    END,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create new RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Update existing admin user if exists
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'adam.homoncik@centrumaudytu.pl';