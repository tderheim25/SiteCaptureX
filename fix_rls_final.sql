-- Final RLS Fix: Completely reset and create proper admin update policies
-- Run this in Supabase SQL Editor

-- 1. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;
DROP POLICY IF EXISTS "Managers can view user and manager profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- 2. Create security definer function to check admin status (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
DECLARE
  user_role_val text;
BEGIN
  SELECT role INTO user_role_val
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role_val = 'admin', false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create new clean policies
-- Allow all authenticated users to read profiles
CREATE POLICY "Allow read access" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile OR admin to update any profile
CREATE POLICY "Allow profile updates" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR is_admin_user())
  WITH CHECK (auth.uid() = id OR is_admin_user());

-- 4. Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Test admin function
SELECT 
  'Current user admin status:' as message,
  is_admin_user() as is_admin;

SELECT 'RLS policies reset successfully - admins can now update roles!' as result;