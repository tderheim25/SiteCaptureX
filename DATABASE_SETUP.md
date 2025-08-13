# Database Setup Guide

## Issue
The app is showing the error: "Could not find the table 'public.profiles' in the schema cache"

This means the database schema hasn't been set up yet in your Supabase project.

## Solution

You need to run the SQL scripts in your Supabase dashboard to create the required tables and functions.

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `ryuzzetivvijkiribkzt`

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query"

### Step 3: Create the Profiles Table
Copy and paste this SQL code into the editor:

```sql
-- Create user roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  role user_role DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger function for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    'user'::user_role
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Step 4: Run the Complete Role Management Script
After creating the basic table, run the complete role management script from `role_management.sql`:

1. Open the `role_management.sql` file in this project
2. Copy all the content
3. Paste it into a new SQL query in Supabase
4. Click "Run" to execute

### Step 5: Verify Setup
Run this query to verify the table was created:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Step 6: Test the App
After running the SQL scripts:
1. Restart your Expo development server
2. The "Could not find the table 'public.profiles'" error should be resolved
3. User management functionality should work properly

## Important Notes
- Make sure to run the SQL scripts in the correct order
- The first script creates the basic table structure
- The role_management.sql script adds advanced features like RLS policies
- Always backup your database before running SQL scripts in production