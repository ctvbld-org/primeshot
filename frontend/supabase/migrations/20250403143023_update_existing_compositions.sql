-- Create orders for existing compositions
WITH new_orders AS (
  INSERT INTO public.orders (user_id, status, amount, currency)
  SELECT DISTINCT user_id, 'draft', 2900, 'usd'
  FROM public.compositions
  WHERE order_id IS NULL
  RETURNING id, user_id
)
UPDATE public.compositions
SET order_id = new_orders.id
FROM new_orders
WHERE compositions.user_id = new_orders.user_id
  AND compositions.order_id IS NULL; 