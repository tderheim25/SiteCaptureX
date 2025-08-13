-- 1. Create user roles enum type 
 CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user'); 
 
 -- 2. Add role column to profiles table (if it doesn't exist) 
 ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user'; 
 
 -- 3. Update the trigger function to always default to 'user' role 
 CREATE OR REPLACE FUNCTION public.handle_new_user() 
 RETURNS trigger AS $ 
 BEGIN 
   INSERT INTO public.profiles (id, full_name, avatar_url, username, role) 
   VALUES ( 
     new.id, 
     new.raw_user_meta_data->>'full_name', 
     new.raw_user_meta_data->>'avatar_url', 
     new.raw_user_meta_data->>'username', 
     'user'::user_role  -- Always default to 'user' role regardless of input 
   ); 
   RETURN new; 
 END; 
 $ language plpgsql security definer; 
 
 -- 4. Add RLS policies for role-based access 
 -- Admins can see all profiles 
 DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles; 
 CREATE POLICY "Admins can view all profiles" 
   ON profiles FOR SELECT 
   TO authenticated 
   USING ( 
     EXISTS ( 
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() AND role = 'admin' 
     ) 
   ); 
 
 -- Managers can see user and manager profiles (not admin) 
 DROP POLICY IF EXISTS "Managers can view user and manager profiles" ON profiles; 
 CREATE POLICY "Managers can view user and manager profiles" 
   ON profiles FOR SELECT 
   TO authenticated 
   USING ( 
     EXISTS ( 
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() AND role = 'manager' 
     ) AND role IN ('user', 'manager') 
   ); 
 
 -- Users can only see their own profile and public info 
 DROP POLICY IF EXISTS "Users can view their own profile" ON profiles; 
 CREATE POLICY "Users can view their own profile" 
   ON profiles FOR SELECT 
   TO authenticated 
   USING (auth.uid() = id); 
 
 -- Only admins can update user roles 
 DROP POLICY IF EXISTS "Only admins can update roles" ON profiles; 
 CREATE POLICY "Only admins can update roles" 
   ON profiles FOR UPDATE 
   TO authenticated 
   USING ( 
     auth.uid() = id OR 
     EXISTS ( 
       SELECT 1 FROM profiles 
       WHERE id = auth.uid() AND role = 'admin' 
     ) 
   ); 
 
 -- Create a function to check user role 
 CREATE OR REPLACE FUNCTION get_user_role(user_id uuid) 
 RETURNS user_role AS $$ 
 DECLARE 
   user_role_result user_role; 
 BEGIN 
   SELECT role INTO user_role_result 
   FROM profiles 
   WHERE id = user_id; 
   
   RETURN COALESCE(user_role_result, 'user'::user_role); 
 END; 
 $$ language plpgsql security definer; 
 
 -- Create a function to check if user has role 
 CREATE OR REPLACE FUNCTION user_has_role(required_role user_role) 
 RETURNS boolean AS $$ 
 BEGIN 
   RETURN ( 
     SELECT CASE 
       WHEN required_role = 'user' THEN role IN ('user', 'manager', 'admin') 
       WHEN required_role = 'manager' THEN role IN ('manager', 'admin')  
       WHEN required_role = 'admin' THEN role = 'admin' 
       ELSE false 
     END 
     FROM profiles 
     WHERE id = auth.uid() 
   ); 
 END; 
 $$ language plpgsql security definer; 
 
 -- View current table structure 
 SELECT 
     column_name, 
     data_type, 
     is_nullable, 
     column_default 
 FROM information_schema.columns 
 WHERE table_name = 'profiles' 
     AND table_schema = 'public' 
 ORDER BY ordinal_position;