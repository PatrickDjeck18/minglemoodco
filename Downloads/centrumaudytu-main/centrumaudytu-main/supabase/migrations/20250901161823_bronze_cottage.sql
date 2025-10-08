/*
  # Fix exams table RLS policies

  1. Security
    - Add INSERT policy for admins to create exams
    - Ensure admins can create new exam records

  2. Changes
    - Add policy allowing authenticated admin users to insert exams
*/

-- Add INSERT policy for admins
CREATE POLICY "Admins can create exams" 
  ON public.exams 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );