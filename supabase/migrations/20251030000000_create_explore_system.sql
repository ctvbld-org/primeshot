-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create explore_categories table
CREATE TABLE IF NOT EXISTS public.explore_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cta_link TEXT DEFAULT '/pricing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create explore_images table
CREATE TABLE IF NOT EXISTS public.explore_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  generated_image_id UUID REFERENCES public.generated_images(id) ON DELETE CASCADE,
  inference_id UUID REFERENCES public.inference_jobs(id) ON DELETE CASCADE,
  style_id UUID REFERENCES public.styles(id) ON DELETE CASCADE,
  wardrobe_id UUID REFERENCES public.style_wardrobes(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.style_scenes(id) ON DELETE CASCADE,
  color_id UUID REFERENCES public.style_colors(id) ON DELETE CASCADE,
  aspect_ratio TEXT,
  resolution TEXT,
  category_id UUID REFERENCES public.explore_categories(id) ON DELETE SET NULL,
  s3_path TEXT NOT NULL,
  original_s3_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(generated_image_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_explore_images_style_id ON public.explore_images(style_id);
CREATE INDEX IF NOT EXISTS idx_explore_images_category_id ON public.explore_images(category_id);
CREATE INDEX IF NOT EXISTS idx_explore_images_user_id ON public.explore_images(user_id);
CREATE INDEX IF NOT EXISTS idx_explore_images_generated_image_id ON public.explore_images(generated_image_id);

-- Enable Row Level Security
ALTER TABLE public.explore_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explore_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for explore_categories
-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone"
  ON public.explore_categories FOR SELECT
  USING (true);

-- Only admins can insert categories
CREATE POLICY "Categories can be inserted by admins"
  ON public.explore_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- Only admins can update categories
CREATE POLICY "Categories can be updated by admins"
  ON public.explore_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- Only admins can delete categories
CREATE POLICY "Categories can be deleted by admins"
  ON public.explore_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- RLS Policies for explore_images
-- Everyone can read explore images
CREATE POLICY "Explore images are viewable by everyone"
  ON public.explore_images FOR SELECT
  USING (true);

-- Only admins can insert explore images
CREATE POLICY "Explore images can be inserted by admins"
  ON public.explore_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- Only admins can update explore images
CREATE POLICY "Explore images can be updated by admins"
  ON public.explore_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- Only admins can delete explore images
CREATE POLICY "Explore images can be deleted by admins"
  ON public.explore_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND admin = true
    )
  );

-- Seed initial categories from existing styles
INSERT INTO public.explore_categories (name, title, description, cta_link)
SELECT DISTINCT 
  s.name, 
  s.name, 
  '', 
  '/pricing'
FROM public.styles s
WHERE s.name IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_explore_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_explore_categories_updated_at
  BEFORE UPDATE ON public.explore_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_explore_updated_at();

CREATE TRIGGER update_explore_images_updated_at
  BEFORE UPDATE ON public.explore_images
  FOR EACH ROW
  EXECUTE FUNCTION update_explore_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.explore_categories IS 'Categories for organizing explore showcase images';
COMMENT ON TABLE public.explore_images IS 'Curated images for the public explore showcase page';
COMMENT ON COLUMN public.explore_images.generated_image_id IS 'Reference to the original generated image';
COMMENT ON COLUMN public.explore_images.s3_path IS 'Path to the copied image in app-images/placeholders/styles/';
COMMENT ON COLUMN public.explore_images.original_s3_path IS 'Original path from generated_images.web_path';

