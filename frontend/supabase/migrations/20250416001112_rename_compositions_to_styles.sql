-- First drop any policies that reference the styles table
-- to avoid errors when the table is renamed
DROP POLICY IF EXISTS "Styles are viewable by the user who created them" ON "public"."styles";
DROP POLICY IF EXISTS "Styles are insertable by the user who owns them" ON "public"."styles";
DROP POLICY IF EXISTS "Styles are updatable by the user who owns them" ON "public"."styles";
DROP POLICY IF EXISTS "Styles are deletable by the user who owns them" ON "public"."styles";

-- Rename table from styles to styles
ALTER TABLE IF EXISTS "public"."styles" RENAME TO "styles";

-- Rename style_id to style_id in the images table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'images' 
    AND column_name = 'style_id'
  ) THEN
    ALTER TABLE "public"."images" RENAME COLUMN "style_id" TO "style_id";
  END IF;
END;
$$;

-- Rename the primary key constraint
ALTER INDEX IF EXISTS "styles_pkey" RENAME TO "styles_pkey";

-- Update sequences if they exist
ALTER SEQUENCE IF EXISTS "styles_id_seq" RENAME TO "styles_id_seq";

-- Update foreign key constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'images_style_id_fkey'
  ) THEN
    ALTER TABLE "public"."images" 
    DROP CONSTRAINT "images_style_id_fkey",
    ADD CONSTRAINT "images_style_id_fkey" 
    FOREIGN KEY ("style_id") REFERENCES "public"."styles" ("id") ON DELETE CASCADE;
  END IF;
END;
$$;

-- Create new policies for the renamed table
CREATE POLICY "Styles are viewable by the user who created them" 
  ON "public"."styles" FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Styles are insertable by the user who owns them" 
  ON "public"."styles" FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Styles are updatable by the user who owns them" 
  ON "public"."styles" FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Styles are deletable by the user who owns them" 
  ON "public"."styles" FOR DELETE 
  USING (auth.uid() = user_id);

-- Comment on the styles table for better documentation
COMMENT ON TABLE "public"."styles" IS 'Stores headshot style configurations created by users';

-- Note: If there are any VIEWS, TRIGGERS, or STORED PROCEDURES using styles table,
-- they would need to be updated as well, but implementing those depends on what exists in your schema
