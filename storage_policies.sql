-- Storage policies for the site-media bucket
-- Run this in Supabase SQL Editor after creating the site-media bucket

-- Note: RLS is already enabled on storage.objects and storage.buckets in Supabase projects.
-- We omit ALTER TABLE statements to avoid ownership errors when running as a non-owner role.

-- Policy 1: Allow authenticated users to view all objects in site-media bucket
-- This allows staff to see all site media across projects
CREATE POLICY "Allow authenticated users to view site-media objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'site-media');

-- Policy 2: Allow authenticated users to upload to site-media bucket
-- Path structure should be: site_id/yyyy/mm/user_id/filename
CREATE POLICY "Allow authenticated users to upload to site-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-media' 
  AND auth.uid() IS NOT NULL
);

-- Policy 3: Allow users to update their own uploads or admins to update any
CREATE POLICY "Allow users to update own uploads or admins update any"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-media' 
  AND (
    -- User can update their own uploads (check if path contains their user_id)
    auth.uid()::text = split_part(name, '/', 4)
    OR
    -- Or user is admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'site-media' 
  AND (
    auth.uid()::text = split_part(name, '/', 4)
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy 4: Allow users to delete their own uploads or admins to delete any
CREATE POLICY "Allow users to delete own uploads or admins delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-media' 
  AND (
    -- User can delete their own uploads
    auth.uid()::text = split_part(name, '/', 4)
    OR
    -- Or user is admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy 5: Allow viewing the site-media bucket itself
CREATE POLICY "Allow authenticated users to view site-media bucket"
ON storage.buckets
FOR SELECT
TO authenticated
USING (id = 'site-media');

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('objects', 'buckets') 
AND schemaname = 'storage'
ORDER BY tablename, policyname;