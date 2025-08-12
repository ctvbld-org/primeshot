-- Migration: Remove legacy orders table and dependent artifacts
-- Date: 2025-08-12

-- 1) Defensive cleanup of potential foreign keys/columns that referenced orders
ALTER TABLE IF EXISTS public.styles
  DROP CONSTRAINT IF EXISTS styles_order_id_fkey;

ALTER TABLE IF EXISTS public.upload_sessions
  DROP CONSTRAINT IF EXISTS upload_sessions_order_id_fkey;

-- styles.order_id was part of the old order-based system; ensure it's gone
ALTER TABLE IF EXISTS public.styles
  DROP COLUMN IF EXISTS order_id;

-- 2) Remove trigger and policies on orders if they exist
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;

-- 3) Drop the orders table
DROP TABLE IF EXISTS public.orders CASCADE;


