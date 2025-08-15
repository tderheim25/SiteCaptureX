-- Updated fix for 'Database error saving new user' - Complete fix with status field

-- Create user_status enum if it doesn't exist (or alter existing one)
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN 
        -- If enum exists, add 'pending' if it doesn't exist
        BEGIN
            ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending';
        EXCEPTION
            WHEN OTHERS THEN null;
        END;
END $$;

-- Add status column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'pending';

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function in public schema with security definer (with status and timestamp)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Try to insert with all required fields including status and timestamps
  BEGIN
    INSERT INTO public.profiles (id, full_name, username, status, created_at, updated_at)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'fullName',
      new.raw_user_meta_data->>'username',
      'pending'::user_status,
      now(),
      now()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, update instead
      UPDATE public.profiles SET
        full_name = new.raw_user_meta_data->>'fullName',
        username = new.raw_user_meta_data->>'username',
        updated_at = now()
      WHERE id = new.id;
    WHEN OTHERS THEN
      -- Log the error and continue
      RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
      RAISE NOTICE 'User ID: %, Metadata: %', new.id, new.raw_user_meta_data;
  END;
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add some debugging to help identify issues
CREATE OR REPLACE FUNCTION public.debug_new_user()
RETURNS trigger AS $$
BEGIN
  RAISE NOTICE 'New user trigger fired for user ID: %', new.id;
  RAISE NOTICE 'User metadata: %', new.raw_user_meta_data;
  RAISE NOTICE 'fullName: %', new.raw_user_meta_data->>'fullName';
  RAISE NOTICE 'username: %', new.raw_user_meta_data->>'username';
  RAISE NOTICE 'avatar_url: %', new.raw_user_meta_data->>'avatar_url';
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create debug trigger (optional - can be removed after testing)
DROP TRIGGER IF EXISTS debug_auth_user_created ON auth.users;
CREATE TRIGGER debug_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.debug_new_user();

-- Success message
SELECT 'Updated trigger fix applied! New users will have status=pending and proper timestamps.' as message;
SELECT 'Debug logging enabled - check Supabase logs for detailed error information.' as debug_info;
SELECT 'IMPORTANT: Run this updated script in Supabase SQL Editor to fix status and timestamps!' as urgent_fix;
SELECT 'After running: 1) Test signup 2) Verify status=pending 3) Check login redirects to waiting approval' as instructions;