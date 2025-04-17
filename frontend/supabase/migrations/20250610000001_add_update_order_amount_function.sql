-- Create or replace function to update order amount based on style count
CREATE OR REPLACE FUNCTION public.update_order_amount(p_order_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_style_count INTEGER;
  v_price INTEGER;
  v_result JSONB;
BEGIN
  -- Verify the order exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = p_order_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Order not found or does not belong to user';
  END IF;

  -- Count styles for this order with status 'draft'
  -- Use FOR UPDATE to lock the style rows and prevent concurrent modifications during calculation
  SELECT COUNT(*)
  INTO v_style_count
  FROM public.styles
  WHERE order_id = p_order_id 
    AND status = 'draft'
  FOR UPDATE;  -- prevent concurrent modifications during calculation

  -- Calculate the price based on style count
  v_price := CASE
    -- Individual tier (1 style)
    WHEN v_style_count = 1 THEN 2900
    -- Professional tier (2-3 styles)
    WHEN v_style_count BETWEEN 2 AND 3 THEN 4900
    -- Studio tier (4-6 styles)
    WHEN v_style_count BETWEEN 4 AND 6 THEN 7900
    -- Studio tier + add-ons (7+ styles): 7900 + 1500 per style over 6
    WHEN v_style_count > 6 THEN 7900 + (v_style_count - 6) * 1500
    -- Default (0 styles)
    ELSE 0
  END;

  -- Update the order with the calculated amount
  UPDATE public.orders
  SET amount = v_price, updated_at = NOW()
  WHERE id = p_order_id AND user_id = p_user_id;

  -- Return result
  v_result := jsonb_build_object(
    'order_id', p_order_id,
    'style_count', v_style_count,
    'price', v_price
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_order_amount TO authenticated;

-- Add comment explaining function
COMMENT ON FUNCTION public.update_order_amount IS 'Calculates and updates an order''s amount based on the count of associated styles with status = draft. Returns the updated price and style count.'; 