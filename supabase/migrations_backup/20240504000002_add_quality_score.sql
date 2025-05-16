-- Add quality_score column to images table
ALTER TABLE public.images
  ADD COLUMN quality_score INTEGER;

-- Add comment for the new column
COMMENT ON COLUMN public.images.quality_score IS 'Quality score of the image from 0-100'; 