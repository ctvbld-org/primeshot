-- Add seed column to generated_images table
-- This stores the seed value used to generate each image for reproducibility

ALTER TABLE "public"."generated_images" 
ADD COLUMN "seed" bigint;

-- Add index on seed for potential filtering/searching
CREATE INDEX idx_generated_images_seed ON public.generated_images USING btree (seed);

-- Add comment to document the column
COMMENT ON COLUMN "public"."generated_images"."seed" IS 'The seed value used to generate this image for reproducibility';
