-- Add UNIQUE constraint to style_options.category
ALTER TABLE style_options
  ADD CONSTRAINT style_options_category_unique UNIQUE (category);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT style_options_category_unique ON style_options IS 
  'Ensures each category (background, clothing, clothingColor) only appears once in the table to match API assumptions'; 