-- Add unique constraint to style_options.category column
-- Description: Ensures each category in style_options table is unique to maintain data integrity

-- First, remove any duplicate categories if they exist (keeping the first occurrence)
WITH duplicates AS (
  SELECT category, 
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) as rn
  FROM style_options
  WHERE category IS NOT NULL
)
DELETE FROM style_options
WHERE id IN (
  SELECT s.id 
  FROM style_options s
  JOIN duplicates d ON s.category = d.category
  WHERE d.rn > 1
);

-- Now add the unique constraint
ALTER TABLE style_options
ADD CONSTRAINT style_options_category_unique UNIQUE (category);

-- Add a comment to the constraint
COMMENT ON CONSTRAINT style_options_category_unique ON style_options
IS 'Ensures each style option category is unique across the table'; 