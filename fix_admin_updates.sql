-- Fix admin role update permissions
-- Run this in Supabase SQL Editor

-- Drop existing update policies that might be too restrictive
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

-- Allow admins to update any profile (including roles)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );

-- Verify policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

SELECT 'Admin update policies fixed!' as message;