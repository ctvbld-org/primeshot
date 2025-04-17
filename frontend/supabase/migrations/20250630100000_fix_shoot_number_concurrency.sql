-- Fix concurrency issue in assign_shoot_number function
-- This migration adds FOR UPDATE to prevent race conditions when 
-- multiple orders are created simultaneously for the same user

-- Update the function to use row-level locking
CREATE OR REPLACE FUNCTION public.assign_shoot_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Find the highest shoot_number for this user and increment by 1
  -- Use FOR UPDATE to lock rows for this user and prevent race conditions
  SELECT COALESCE(MAX(shoot_number), 0) + 1 INTO next_number
  FROM public.orders
  WHERE user_id = NEW.user_id
  FOR UPDATE;
  
  -- Assign the next number to the new order
  NEW.shoot_number := next_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function to explain the concurrency protection
COMMENT ON FUNCTION public.assign_shoot_number IS 'Assigns sequential shoot numbers to orders per user with concurrency protection using row-level locking'; 