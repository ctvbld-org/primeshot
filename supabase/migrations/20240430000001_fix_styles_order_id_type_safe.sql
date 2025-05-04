-- Temporarily remove the foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'styles_order_id_fkey'
  ) THEN
    ALTER TABLE styles DROP CONSTRAINT styles_order_id_fkey;
  END IF;
END
$$;

-- Create a temporary column with the new type
ALTER TABLE styles ADD COLUMN order_id_new uuid;

-- Update the new column, handling invalid UUIDs
DO $$
BEGIN
  -- Try to convert valid UUIDs
  UPDATE styles 
  SET order_id_new = order_id::uuid 
  WHERE order_id IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  -- If any conversion fails, we'll handle it in the next step
  NULL;
END
$$;

-- Drop the old column and rename the new one
ALTER TABLE styles DROP COLUMN order_id;
ALTER TABLE styles RENAME COLUMN order_id_new TO order_id;

-- Add the foreign key constraint
ALTER TABLE styles
  ADD CONSTRAINT styles_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES orders(id)
  ON DELETE CASCADE;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS 
  'Links styles to their associated order, cascade deletes styles when order is deleted'; 