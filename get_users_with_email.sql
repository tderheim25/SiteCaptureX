-- Fixed function to handle users with missing profile data
-- Drop existing function first to avoid signature conflicts
drop function if exists get_users_with_email();

create or replace function get_users_with_email()
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  role text,
  status text,
  email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    coalesce(p.username, u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)) as username,
    coalesce(p.full_name, u.raw_user_meta_data->>'fullName', u.raw_user_meta_data->>'full_name') as full_name,
    coalesce(p.avatar_url, u.raw_user_meta_data->>'avatar_url') as avatar_url,
    coalesce(p.role, 'user') as role,
    coalesce(p.status, 'pending') as status,
    u.email,
    coalesce(p.created_at, u.created_at) as created_at
  from
    auth.users u
  left join
    profiles p on u.id = p.id
  order by u.created_at desc
$$;