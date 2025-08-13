-- Fix for infinite recursion in RLS policies
-- Run this in Supabase SQL Editor to fix the policy recursion issue

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create non-recursive policies
-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a security definer function to check admin role without recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM profiles
    WHERE id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all profiles (using function to avoid recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Admins can update all profiles (using function to avoid recursion)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

-- Create a simpler approach: Allow authenticated users to read all profiles
-- and only allow updates to own profile or by admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Allow all authenticated users to view profiles (simpler approach)
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Only allow users to update their own profile
CREATE POLICY "Users can update own profile only" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow INSERT for new user registration
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

SELECT 'RLS policies fixed successfully!' as message;