-- Fix race condition in shoot number generation
-- Description: Prevents duplicate shoot numbers through both unique constraint and FOR UPDATE

-- Add unique constraint to prevent duplicate shoot numbers per user
ALTER TABLE orders
ADD CONSTRAINT orders_user_id_shoot_number_unique 
UNIQUE (user_id, shoot_number);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT orders_user_id_shoot_number_unique ON orders
IS 'Prevents duplicate shoot numbers for the same user, protecting against race conditions';

-- Update the function to use FOR UPDATE
CREATE OR REPLACE FUNCTION set_shoot_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Lock the row(s) we're reading to prevent concurrent reads
  WITH max_number AS (
    SELECT COALESCE(MAX(shoot_number), 0) as max_num
    FROM orders
    WHERE user_id = NEW.user_id
    FOR UPDATE
  )
  SELECT max_num + 1 
  INTO NEW.shoot_number 
  FROM max_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 