-- Add face_model_id column to images table for training workflow
-- This field links images to face models for training purposes
-- Also remove order_id since face_model_id is the primary relationship

-- Add face_model_id column to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS face_model_id UUID;

-- Add foreign key constraint to face_models table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_images_face_model_id' 
        AND table_name = 'images'
    ) THEN
        ALTER TABLE public.images
        ADD CONSTRAINT fk_images_face_model_id
        FOREIGN KEY (face_model_id) REFERENCES public.face_models(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_images_face_model_id ON public.images(face_model_id);

-- Remove order_id column and its constraints
-- First drop the foreign key constraint
ALTER TABLE public.images 
DROP CONSTRAINT IF EXISTS images_order_id_fkey;

-- Drop the order_id column
ALTER TABLE public.images 
DROP COLUMN IF EXISTS order_id;

-- Update existing images to have face_model_id if possible
-- This is a one-time update for existing data
-- Note: This may not work for existing data without additional logic
-- but it prepares the schema for future uploads

-- Add comment for documentation
COMMENT ON COLUMN public.images.face_model_id IS 'Links image to a face model for training purposes'; 