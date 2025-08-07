-- Migration: Rename face_models table and references to characters
-- This migration renames the face_models table to characters and updates all foreign key references

-- 1. Drop existing foreign key constraints
ALTER TABLE "public"."images" DROP CONSTRAINT IF EXISTS "fk_images_face_model_id";
ALTER TABLE "public"."inference_jobs" DROP CONSTRAINT IF EXISTS "inference_jobs_face_model_id_fkey";
ALTER TABLE "public"."training_jobs" DROP CONSTRAINT IF EXISTS "training_jobs_face_model_id_fkey";
ALTER TABLE "public"."upload_sessions" DROP CONSTRAINT IF EXISTS "upload_sessions_face_model_id_fkey";

-- 2. Drop existing indexes on face_model_id columns
DROP INDEX IF EXISTS "public"."idx_images_face_model_id";
DROP INDEX IF EXISTS "public"."idx_inference_jobs_face_model_id";
DROP INDEX IF EXISTS "public"."idx_training_jobs_face_model_id";
DROP INDEX IF EXISTS "public"."idx_upload_sessions_face_model_id";

-- 3. Rename face_model_id columns to character_id
ALTER TABLE "public"."images" RENAME COLUMN "face_model_id" TO "character_id";
ALTER TABLE "public"."inference_jobs" RENAME COLUMN "face_model_id" TO "character_id";
ALTER TABLE "public"."training_jobs" RENAME COLUMN "face_model_id" TO "character_id";
ALTER TABLE "public"."upload_sessions" RENAME COLUMN "face_model_id" TO "character_id";

-- 4. Rename face_models table to characters
ALTER TABLE "public"."face_models" RENAME TO "characters";

-- 5. Update table and column comments
COMMENT ON TABLE "public"."characters" IS 'Stores character data for AI training and inference';
COMMENT ON COLUMN "public"."images"."character_id" IS 'Links image to a character for training purposes';

-- 6. Rename constraints to reflect new table name
ALTER TABLE "public"."characters" RENAME CONSTRAINT "chk_face_models_image_count_positive" TO "chk_characters_image_count_positive";
ALTER TABLE "public"."characters" RENAME CONSTRAINT "face_models_status_check" TO "characters_status_check";

-- 7. Create new indexes on character_id columns
CREATE INDEX "idx_images_character_id" ON "public"."images" USING "btree" ("character_id");
CREATE INDEX "idx_inference_jobs_character_id" ON "public"."inference_jobs" USING "btree" ("character_id");
CREATE INDEX "idx_training_jobs_character_id" ON "public"."training_jobs" USING "btree" ("character_id");
CREATE INDEX "idx_upload_sessions_character_id" ON "public"."upload_sessions" USING "btree" ("character_id");

-- 8. Recreate foreign key constraints with new names
ALTER TABLE "public"."images" 
ADD CONSTRAINT "fk_images_character_id" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE SET NULL;

ALTER TABLE "public"."inference_jobs" 
ADD CONSTRAINT "inference_jobs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;

ALTER TABLE "public"."training_jobs" 
ADD CONSTRAINT "training_jobs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;

ALTER TABLE "public"."upload_sessions" 
ADD CONSTRAINT "upload_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;

-- 9. Drop the old function with old parameter name first
DROP FUNCTION IF EXISTS "public"."increment_image_count"("face_model_id" "uuid");

-- 10. Create the function with new parameter name
CREATE OR REPLACE FUNCTION "public"."increment_image_count"("character_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE characters 
    SET image_count = image_count + 1, updated_at = now() 
    WHERE id = character_id;
END;
$$;

-- Grant permissions on the updated function
GRANT ALL ON FUNCTION "public"."increment_image_count"("character_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_image_count"("character_id" "uuid") TO "service_role";

-- 11. Update RLS policies that reference character_id
-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own upload sessions" ON "public"."upload_sessions";
DROP POLICY IF EXISTS "Users can insert their own upload sessions" ON "public"."upload_sessions";
DROP POLICY IF EXISTS "Users can view their own upload sessions" ON "public"."upload_sessions";

-- Recreate policies with updated column references
CREATE POLICY "Users can delete their own upload sessions" ON "public"."upload_sessions"
    AS PERMISSIVE FOR DELETE TO "authenticated"
    USING (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM characters
           WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));

CREATE POLICY "Users can insert their own upload sessions" ON "public"."upload_sessions"
    AS PERMISSIVE FOR INSERT TO "authenticated"
    WITH CHECK (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM characters
           WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));

CREATE POLICY "Users can view their own upload sessions" ON "public"."upload_sessions"
    AS PERMISSIVE FOR SELECT TO "authenticated"
    USING (((auth.uid() = user_id) OR ((character_id IS NOT NULL) AND (EXISTS ( SELECT 1
           FROM characters
           WHERE ((characters.id = upload_sessions.character_id) AND (characters.user_id = auth.uid())))))));