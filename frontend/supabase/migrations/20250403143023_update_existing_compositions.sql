-- Create orders for existing styles
WITH new_orders AS (
  INSERT INTO public.orders (user_id, status, amount, currency)
  SELECT DISTINCT user_id, 'draft', 2900, 'usd'
  FROM public.styles
  WHERE order_id IS NULL
  RETURNING id, user_id
)
UPDATE public.styles
SET order_id = new_orders.id
FROM new_orders
WHERE styles.user_id = new_orders.user_id
  AND styles.order_id IS NULL; 