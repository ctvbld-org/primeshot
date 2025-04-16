-- Create new policies for the styles table
DO $$
BEGIN
  -- Check if a policy with this name already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'styles' 
    AND policyname = 'Styles are viewable by the user who created them'
  ) THEN
    EXECUTE 'CREATE POLICY "Styles are viewable by the user who created them" 
      ON "public"."styles" FOR SELECT 
      USING (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'styles' 
    AND policyname = 'Styles are insertable by the user who owns them'
  ) THEN
    EXECUTE 'CREATE POLICY "Styles are insertable by the user who owns them" 
      ON "public"."styles" FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'styles' 
    AND policyname = 'Styles are updatable by the user who owns them'
  ) THEN
    EXECUTE 'CREATE POLICY "Styles are updatable by the user who owns them" 
      ON "public"."styles" FOR UPDATE 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'styles' 
    AND policyname = 'Styles are deletable by the user who owns them'
  ) THEN
    EXECUTE 'CREATE POLICY "Styles are deletable by the user who owns them" 
      ON "public"."styles" FOR DELETE 
      USING (auth.uid() = user_id)';
  END IF;
END;
$$;

-- Comment on the styles table for better documentation
COMMENT ON TABLE "public"."styles" IS 'Stores headshot style configurations created by users'; 