-- Add status column to compositions table
ALTER TABLE public.compositions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('draft', 'pending', 'processing', 'completed'));

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own compositions" ON public.compositions;
CREATE POLICY "Users can view their own compositions"
ON public.compositions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own compositions" ON public.compositions;
CREATE POLICY "Users can insert their own compositions"
ON public.compositions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own compositions" ON public.compositions;
CREATE POLICY "Users can update their own compositions"
ON public.compositions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.compositions.status IS 'Status of the composition: draft, pending, processing, or completed'; 