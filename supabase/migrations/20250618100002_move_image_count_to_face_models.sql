-- Move image_count from training_jobs to face_models table
-- This makes more architectural sense as image count is a property of the face model, not the training job

-- Add image_count column to face_models table
ALTER TABLE public.face_models 
ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;

-- Update existing face_models with their current image count
UPDATE public.face_models 
SET image_count = (
    SELECT COUNT(*) 
    FROM public.images 
    WHERE images.face_model_id = face_models.id
)
WHERE image_count IS NULL OR image_count = 0;

-- Remove image_count column from training_jobs table
ALTER TABLE public.training_jobs 
DROP COLUMN IF EXISTS image_count;

-- Add index for performance on face_models.image_count
CREATE INDEX IF NOT EXISTS idx_face_models_image_count ON public.face_models(image_count);

-- Add constraint to ensure image_count is non-negative (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_face_models_image_count_positive' 
        AND table_name = 'face_models'
    ) THEN
        ALTER TABLE public.face_models 
        ADD CONSTRAINT chk_face_models_image_count_positive 
        CHECK (image_count >= 0);
    END IF;
END $$; 