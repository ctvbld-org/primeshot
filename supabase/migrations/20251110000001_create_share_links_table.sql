-- Create share_links table for URL shortener
-- This enables users to share their generated images with short, trackable links

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(8) UNIQUE NOT NULL,
  style_id VARCHAR(255),
  scene_id VARCHAR(255),
  wardrobe_id VARCHAR(255),
  color_id VARCHAR(255),
  quality VARCHAR(50),
  aspect_ratio VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_share_links_short_code ON share_links(short_code);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_created_at ON share_links(created_at);

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can follow shared links)
CREATE POLICY "Anyone can read share links"
  ON share_links FOR SELECT
  TO public
  USING (true);

-- Authenticated users can create share links
CREATE POLICY "Authenticated users can create share links"
  ON share_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own share links (for click counting)
CREATE POLICY "System can update share links"
  ON share_links FOR UPDATE
  TO public
  USING (true);

