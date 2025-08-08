-- Migration: Ensure admin INSERT/UPDATE policies exist on public.styles
-- Context: The rename of style_configs->styles dropped earlier policies; recreate them

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Recreate admin-only INSERT policy
DROP POLICY IF EXISTS "Admins can insert styles" ON public.styles;
CREATE POLICY "Admins can insert styles"
  ON public.styles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );

-- Recreate admin-only UPDATE policy
DROP POLICY IF EXISTS "Admins can update styles" ON public.styles;
CREATE POLICY "Admins can update styles"
  ON public.styles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.admin = true
    )
  );


