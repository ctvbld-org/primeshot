-- Migration: Fix explore tables permissions for service_role
-- Issue: service_role was getting "permission denied" when trying to sync explore tables
-- Solution: Grant table-level privileges to service_role (same as other syncable tables)

-- Grant all privileges to service_role on explore tables
GRANT ALL PRIVILEGES ON TABLE public.explore_categories TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.explore_images TO service_role;

-- Also grant SELECT to anon and authenticated for public access
GRANT SELECT ON public.explore_categories TO anon, authenticated;
GRANT SELECT ON public.explore_images TO anon, authenticated;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access to explore_categories" ON public.explore_categories;
DROP POLICY IF EXISTS "Public read access to explore_images" ON public.explore_images;
DROP POLICY IF EXISTS "Users can view their own explore images" ON public.explore_images;

-- Create RLS policies
-- Public read access for website
CREATE POLICY "Public read access to explore_categories"
  ON public.explore_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Public read access to explore_images"
  ON public.explore_images
  FOR SELECT
  USING (true);

-- Add comments
COMMENT ON TABLE public.explore_categories IS 
  'Explore page categories with service_role grants for admin panel sync';
COMMENT ON TABLE public.explore_images IS 
  'Explore page showcase images with service_role grants for admin panel sync';

