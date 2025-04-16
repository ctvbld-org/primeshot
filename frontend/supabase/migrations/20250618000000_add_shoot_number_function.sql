-- Function to assign sequential shoot numbers to orders
CREATE OR REPLACE FUNCTION public.assign_shoot_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Find the highest shoot_number for this user and increment by 1
  SELECT COALESCE(MAX(shoot_number), 0) + 1 INTO next_number
  FROM public.orders
  WHERE user_id = NEW.user_id;
  
  -- Assign the next number to the new order
  NEW.shoot_number := next_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically assign shoot numbers on insert
DROP TRIGGER IF EXISTS assign_shoot_number_trigger ON public.orders;
CREATE TRIGGER assign_shoot_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.assign_shoot_number();

-- Update existing orders that have NULL shoot_number
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