-- Add full_name to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add metadata fields to images table
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT 'untitled',
ADD COLUMN IF NOT EXISTS file_size BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
ADD COLUMN IF NOT EXISTS dimensions JSONB NOT NULL DEFAULT '{"width": 0, "height": 0}';

-- Add constraints to ensure valid mime types
ALTER TABLE public.images
ADD CONSTRAINT valid_mime_type 
CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp'));

-- Add constraints for file size (max 10MB)
ALTER TABLE public.images
ADD CONSTRAINT valid_file_size 
CHECK (file_size > 0 AND file_size <= 10485760);

-- Add constraints for dimensions
ALTER TABLE public.images
ADD CONSTRAINT valid_dimensions 
CHECK (
  (dimensions->>'width')::int > 0 
  AND (dimensions->>'height')::int > 0
);

-- Update compositions settings constraints
ALTER TABLE public.compositions
DROP CONSTRAINT IF EXISTS valid_settings;

ALTER TABLE public.compositions
ADD CONSTRAINT valid_settings CHECK (
  jsonb_typeof(settings->'style') = 'string'
  AND (settings->>'style') IN ('professional', 'casual', 'creative')
  AND jsonb_typeof(settings->'background') = 'string'
  AND (settings->>'background') IN ('plain', 'office', 'outdoor', 'custom')
  AND jsonb_typeof(settings->'lighting') = 'string'
  AND (settings->>'lighting') IN ('studio', 'natural', 'dramatic')
  AND jsonb_typeof(settings->'pose') = 'string'
  AND (settings->>'pose') IN ('front', 'threequarter', 'side')
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON public.users(full_name);
CREATE INDEX IF NOT EXISTS idx_images_mime_type ON public.images(mime_type);

-- Update RLS policies for user updates to include full_name validation
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      full_name IS NULL 
      OR length(full_name) BETWEEN 2 AND 100
    )
  ); 