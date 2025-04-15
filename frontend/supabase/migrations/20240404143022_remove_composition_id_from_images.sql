-- Remove composition_id from images table
ALTER TABLE public.images
DROP COLUMN IF EXISTS composition_id;

-- Update RLS policies to use only user_id
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
CREATE POLICY "Users can view their own images" ON public.images
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
CREATE POLICY "Users can insert their own images" ON public.images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own images" ON public.images;
CREATE POLICY "Users can update their own images" ON public.images
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
CREATE POLICY "Users can delete their own images" ON public.images
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment to document the change
COMMENT ON TABLE public.images IS 'Stores user uploaded images. Images are now associated only with users, not with specific style.'; 