-- Add idempotency_key column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add checkout_session_id column to orders table if it doesn't exist yet
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

-- Add index on idempotency_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);

-- Add comments to explain the columns
COMMENT ON COLUMN public.orders.idempotency_key IS 'Stripe idempotency key used for the most recent payment attempt';
COMMENT ON COLUMN public.orders.checkout_session_id IS 'Stripe checkout session ID for checkout-based payments'; 