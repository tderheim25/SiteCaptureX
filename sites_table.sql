-- Sites table and related DDL for SiteSnapMobile
-- Run this in your Supabase SQL editor to enable the Sites feature

-- Create sites table
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  project_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all sites
CREATE POLICY "All users can read sites" ON public.sites
  FOR SELECT
  USING (true);

-- Policy: Users can insert sites
CREATE POLICY "Authenticated users can insert sites" ON public.sites
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update sites they created OR admins can update any
CREATE POLICY "Users can update their sites or admins can update any" ON public.sites
  FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR 
    (auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    ))
  );

-- Policy: Users can delete sites they created OR admins can delete any
CREATE POLICY "Users can delete their sites or admins can delete any" ON public.sites
  FOR DELETE
  USING (
    auth.uid() = created_by 
    OR 
    (auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    ))
  );

-- Function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_sites_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set created_by automatically
CREATE TRIGGER trigger_set_sites_created_by
  BEFORE INSERT ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.set_sites_created_by();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on updates
CREATE TRIGGER trigger_update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_sites_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;