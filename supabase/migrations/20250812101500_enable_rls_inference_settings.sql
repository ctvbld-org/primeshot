-- Enable RLS and add policies for public read, admin writes on inference_settings

-- Ensure table exists (no-op if already present)
-- CREATE TABLE IF NOT EXISTS public.inference_settings (
--   key text PRIMARY KEY,
--   value jsonb NOT NULL DEFAULT '{}'
-- );

-- Enable RLS
ALTER TABLE public.inference_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates on re-run
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


