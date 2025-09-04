-- Ensure idempotent inserts for generated images per job image index
-- Adds a unique constraint on (inference_id, image_index)

-- Column image_index may not exist in baseline; add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'generated_images'
          AND column_name = 'image_index'
    ) THEN
        ALTER TABLE public.generated_images
        ADD COLUMN image_index integer;
    END IF;
END $$;

-- Create unique index if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname = 'uniq_generated_images_inference_image_index'
    ) THEN
        CREATE UNIQUE INDEX uniq_generated_images_inference_image_index
        ON public.generated_images (inference_id, image_index);
    END IF;
END $$;

COMMENT ON INDEX public.uniq_generated_images_inference_image_index IS 'Prevents duplicate rows for the same job image (inference_id,image_index).';

