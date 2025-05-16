-- Convert order_id in styles table to UUID type
ALTER TABLE styles 
  ALTER COLUMN order_id TYPE uuid USING order_id::uuid;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'styles_order_id_fkey'
  ) THEN
    ALTER TABLE styles
      ADD CONSTRAINT styles_order_id_fkey 
      FOREIGN KEY (order_id) 
      REFERENCES orders(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT styles_order_id_fkey ON styles IS 
  'Links styles to their associated order, cascade deletes styles when order is deleted'; 