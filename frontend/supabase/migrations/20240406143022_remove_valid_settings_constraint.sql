-- Remove the valid_settings constraint from styles table
ALTER TABLE public.styles
DROP CONSTRAINT IF EXISTS valid_settings;

-- Add comment for documentation
COMMENT ON TABLE public.styles IS 'Stores user style preferences without strict field validation'; 