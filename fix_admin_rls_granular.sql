-- Granular RLS: users can update own non-role fields; only admins can change role
-- Run this in Supabase SQL Editor

-- Clear conflicting policies
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Users can update their own profile but cannot elevate role unless they already are admin
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    -- prevent non-admins from changing role value
    (
      auth.uid() = id 
      AND (
        -- either role stays the same
        role = (SELECT role FROM profiles WHERE id = auth.uid())
        -- or current user is already admin (allow admins to edit their own role if needed)
        OR EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
      )
    )
  );

-- Admins can update any profile (including role)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles a WHERE a.id = auth.uid() AND a.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles a WHERE a.id = auth.uid() AND a.role = 'admin'));

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;