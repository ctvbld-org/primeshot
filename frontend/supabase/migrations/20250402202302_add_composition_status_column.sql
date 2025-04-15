-- Add status column to styles table
ALTER TABLE public.styles
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('draft', 'pending', 'processing', 'completed'));

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own styles" ON public.styles;
CREATE POLICY "Users can view their own styles"
ON public.styles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own styles" ON public.styles;
CREATE POLICY "Users can insert their own styles"
ON public.styles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own styles" ON public.styles;
CREATE POLICY "Users can update their own styles"
ON public.styles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.styles.status IS 'Status of the style: draft, pending, processing, or completed'; 