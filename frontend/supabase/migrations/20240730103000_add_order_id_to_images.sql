-- Add the order_id column to the images table
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS order_id UUID;

-- Add a foreign key constraint to link images.order_id to orders.id
-- SET NULL on delete: If an order is deleted, the image record remains but loses its order link.
-- Consider CASCADE if images should be deleted when the order is deleted.
ALTER TABLE public.images
ADD CONSTRAINT images_order_id_fkey FOREIGN KEY (order_id)
REFERENCES public.orders(id) ON DELETE SET NULL;

-- Make composition_id nullable, assuming images are uploaded before being tied to a specific composition
-- Check if the constraint exists before dropping if necessary (syntax might vary slightly based on initial schema)
-- Example: ALTER TABLE public.images ALTER COLUMN composition_id DROP NOT NULL;
-- For safety, let's assume it might be nullable already or handle this manually if needed.
-- We focus on adding the order_id for now.

-- Add an index for performance when querying images by order_id
CREATE INDEX IF NOT EXISTS idx_images_order_id ON public.images(order_id); 