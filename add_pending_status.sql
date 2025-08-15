-- Migration to add pending status for new users

-- Add 'pending' to user_status enum
-- Note: In PostgreSQL, we need to use a transaction to rename and recreate the type
DO $$
BEGIN
    -- Check if 'pending' already exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_status'::regtype AND enumlabel = 'pending') THEN
        ALTER TYPE user_status RENAME TO user_status_old;
        CREATE TYPE user_status AS ENUM ('active', 'disabled', 'pending');
        ALTER TABLE profiles ALTER COLUMN status TYPE user_status USING status::text::user_status;
        DROP TYPE user_status_old;
    END IF;
END $$;

-- Update the trigger to set default status to 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    'user'::user_role,
    'pending'::user_status
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    username = EXCLUDED.username,
    updated_at = now();
  RETURN new;
END;
$$ language plpgsql security definer;

-- Update existing table default if needed
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending'::user_status;

SELECT 'Pending status migration completed!' as message;