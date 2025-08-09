-- Drop the BEFORE UPDATE trigger that attempted to set updated_at on public.images
-- This trigger causes errors because the table has no updated_at column

DROP TRIGGER IF EXISTS update_images_updated_at ON public.images;

-- Note: We intentionally keep the shared function public.update_updated_at_column()
-- because it is still used by other tables.


