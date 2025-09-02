-- Fix inference_settings table: Add missing RLS policies, trigger, and seed data

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to inference_settings table
DROP TRIGGER IF EXISTS trg_inference_settings_updated ON inference_settings;
CREATE TRIGGER trg_inference_settings_updated
  BEFORE UPDATE ON inference_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow public read access to inference_settings" ON public.inference_settings;
DROP POLICY IF EXISTS "Admins can insert inference_settings" ON public.inference_settings;
DROP POLICY IF EXISTS "Admins can update inference_settings" ON public.inference_settings;
DROP POLICY IF EXISTS "Admins can delete inference_settings" ON public.inference_settings;

-- Public read (anon + authenticated)
CREATE POLICY "Allow public read access to inference_settings"
  ON public.inference_settings
  FOR SELECT
  USING (true);

-- Admin-only writes when using user-scoped clients
CREATE POLICY "Admins can insert inference_settings"
  ON public.inference_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can update inference_settings"
  ON public.inference_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

CREATE POLICY "Admins can delete inference_settings"
  ON public.inference_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Grants (RLS still applies)
GRANT SELECT ON public.inference_settings TO anon, authenticated;
GRANT ALL ON public.inference_settings TO service_role;

-- Seed default inference settings (idempotent)
INSERT INTO inference_settings (key, value)
VALUES
  ('qualities', '["1K","2K","4K"]'::jsonb),
  ('quality_labels', '{"1K":"Basic","2K":"Standard","4K":"High"}'::jsonb),
  ('nb_takes_options', '[5,15,20]'::jsonb),
  ('aspect_ratios', '["4:5","16:9","1:1","3:4"]'::jsonb),
  ('defaults', '{"quality":"1K","nb_takes":5,"aspect_ratio":"4:5"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
