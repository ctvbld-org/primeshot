-- Ensure all existing orders have a shoot_number value before making it NOT NULL
-- This will apply any changes for records that might have been missed by the previous data update
DO $$
DECLARE
  user_record RECORD;
  order_record RECORD;
  current_number INTEGER;
BEGIN
  -- For each user
  FOR user_record IN SELECT DISTINCT user_id FROM public.orders WHERE shoot_number IS NULL LOOP
    current_number := 0;
    
    -- For each order without a shoot number, ordered by creation date
    FOR order_record IN 
      SELECT id 
      FROM public.orders 
      WHERE user_id = user_record.user_id AND shoot_number IS NULL
      ORDER BY created_at ASC
    LOOP
      current_number := current_number + 1;
      
      -- Update the order with the next number
      UPDATE public.orders 
      SET shoot_number = current_number
      WHERE id = order_record.id;
    END LOOP;
  END LOOP;
END $$;

-- Verify no NULL shoot_numbers exist
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.orders WHERE shoot_number IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot make shoot_number NOT NULL: % records still have NULL values', null_count;
  END IF;
END $$;

-- Make shoot_number NOT NULL
ALTER TABLE public.orders 
ALTER COLUMN shoot_number SET NOT NULL;

-- Add comment to explain the column's updated constraints
COMMENT ON COLUMN public.orders.shoot_number IS 'Sequential number for each user''s shoots, starting from 1. Non-nullable.'; 