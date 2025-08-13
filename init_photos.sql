-- Run this in Supabase SQL editor
-- 1) Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
select 'site-media', 'site-media', true
where not exists (select 1 from storage.buckets where id = 'site-media');

-- 2) Create site_photos table for metadata
create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  original_name text,
  file_size bigint,
  mime_type text,
  storage_path text not null,
  public_url text,
  width int,
  height int,
  created_at timestamptz default now()
);

-- 3) RLS policies for site_photos
alter table public.site_photos enable row level security;

-- Allow authenticated users to insert their uploads
DROP POLICY IF EXISTS "insert_own_photos" ON public.site_photos;
CREATE POLICY "insert_own_photos"
  ON public.site_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view photos
DROP POLICY IF EXISTS "select_photos" ON public.site_photos;
CREATE POLICY "select_photos"
  ON public.site_photos FOR SELECT TO authenticated
  USING (true);

-- Allow owners or admins to delete
DROP POLICY IF EXISTS "delete_own_or_admin" ON public.site_photos;
CREATE POLICY "delete_own_or_admin"
  ON public.site_photos FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );