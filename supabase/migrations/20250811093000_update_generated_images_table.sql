-- Migration: Update generated_images schema to new structure
-- Date: 2025-08-11

-- 1) Drop old status check constraint if present
ALTER TABLE "public"."generated_images"
DROP CONSTRAINT IF EXISTS "generated_images_status_check";

-- 2) Remove deprecated columns
ALTER TABLE "public"."generated_images"
DROP COLUMN IF EXISTS "style_id",
DROP COLUMN IF EXISTS "upload_id",
DROP COLUMN IF EXISTS "error_message",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "storage_path";

-- 3) Add new required columns
ALTER TABLE "public"."generated_images"
ADD COLUMN "user_id" uuid NOT NULL,
ADD COLUMN "inference_id" uuid NOT NULL,
ADD COLUMN "original_path" text NOT NULL,
ADD COLUMN "web_path" text NOT NULL,
ADD COLUMN "width" integer NOT NULL,
ADD COLUMN "height" integer NOT NULL,
ADD COLUMN "format" text NOT NULL,
ADD COLUMN "bytes" bigint NOT NULL,
ADD COLUMN "favourite" boolean NOT NULL DEFAULT false;

-- 4) Foreign key constraints
ALTER TABLE "public"."generated_images"
ADD CONSTRAINT "generated_images_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
ADD CONSTRAINT "generated_images_inference_id_fkey"
FOREIGN KEY ("inference_id") REFERENCES "public"."inference_jobs"("id") ON DELETE CASCADE;

-- 5) Data integrity constraints
ALTER TABLE "public"."generated_images"
ADD CONSTRAINT "generated_images_width_positive" CHECK ("width" > 0),
ADD CONSTRAINT "generated_images_height_positive" CHECK ("height" > 0),
ADD CONSTRAINT "generated_images_bytes_nonnegative" CHECK ("bytes" >= 0);

-- 6) Indexes
CREATE INDEX IF NOT EXISTS "idx_generated_images_user_id" ON "public"."generated_images" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_generated_images_inference_id" ON "public"."generated_images" ("inference_id");

-- 7) Comments
COMMENT ON COLUMN "public"."generated_images"."user_id" IS 'Owner of the generated image';
COMMENT ON COLUMN "public"."generated_images"."inference_id" IS 'Inference job that produced this image';
COMMENT ON COLUMN "public"."generated_images"."original_path" IS 'S3 path to the original high-res image';
COMMENT ON COLUMN "public"."generated_images"."web_path" IS 'S3 path to the web-optimized variant';
COMMENT ON COLUMN "public"."generated_images"."width" IS 'Image width in pixels';
COMMENT ON COLUMN "public"."generated_images"."height" IS 'Image height in pixels';
COMMENT ON COLUMN "public"."generated_images"."format" IS 'Image format (e.g., png, webp, jpeg)';
COMMENT ON COLUMN "public"."generated_images"."bytes" IS 'Image file size in bytes';
COMMENT ON COLUMN "public"."generated_images"."favourite" IS 'Whether the image is marked as a favorite by the user';


