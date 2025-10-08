/*
  # Create Admin User

  1. New User Creation
    - Creates admin user with email: adam.homoncik@centrumaudytu.pl
    - Sets password to: test1234
    - Confirms email automatically
    - Sets role to admin in profiles table

  2. Security
    - User is created with confirmed email
    - Profile is automatically created with admin role
*/

-- Insert admin user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'adam.homoncik@centrumaudytu.pl',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert admin profile
INSERT INTO public.profiles (
  id,
  email,
  role,
  first_name,
  last_name
) 
SELECT 
  id,
  'adam.homoncik@centrumaudytu.pl',
  'admin',
  'Adam',
  'Homoncik'
FROM auth.users 
WHERE email = 'adam.homoncik@centrumaudytu.pl'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  first_name = 'Adam',
  last_name = 'Homoncik';