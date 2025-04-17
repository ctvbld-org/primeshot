-- Add shoot_number column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shoot_number INTEGER;

-- Create index on shoot_number column for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_shoot_number ON public.orders(shoot_number);

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.orders.shoot_number IS 'Sequential number for each user''s shoots, starting from 1'; 