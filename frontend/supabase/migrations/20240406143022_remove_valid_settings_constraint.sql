-- Remove the valid_settings constraint from compositions table
ALTER TABLE public.compositions
DROP CONSTRAINT IF EXISTS valid_settings;

-- Add comment for documentation
COMMENT ON TABLE public.compositions IS 'Stores user composition preferences without strict field validation'; 