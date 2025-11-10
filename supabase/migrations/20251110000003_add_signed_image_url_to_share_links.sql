-- Add signed_image_url to share_links for social media previews
-- This allows Slack and other platforms to display image previews

-- Add signed_image_url column (nullable for backward compatibility)
ALTER TABLE share_links 
ADD COLUMN IF NOT EXISTS signed_image_url TEXT;

-- Add index for potential future queries
CREATE INDEX IF NOT EXISTS idx_share_links_signed_image_url ON share_links(signed_image_url) WHERE signed_image_url IS NOT NULL;


