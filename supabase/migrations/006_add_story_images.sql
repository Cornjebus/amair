-- =============================================================================
-- Migration: Add Story Images Support
-- Purpose: Store AI-generated illustrations for stories
-- =============================================================================

-- Add image-related columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS art_style TEXT DEFAULT 'watercolor';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS has_illustrations BOOLEAN DEFAULT false;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS illustration_count INTEGER DEFAULT 0;

-- Create story_images table for individual illustrations
-- Note: user_id can be derived from story_id via the stories table
CREATE TABLE IF NOT EXISTS story_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  scene_description TEXT NOT NULL,
  prompt_used TEXT,
  image_url TEXT,
  file_path TEXT,
  public_url TEXT,
  style TEXT DEFAULT 'watercolor',
  model TEXT DEFAULT 'dall-e-3',
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, scene_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_images_story_id ON story_images(story_id);

-- Enable RLS
ALTER TABLE story_images ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for Inngest background jobs)
CREATE POLICY "Service role full access on images"
  ON story_images FOR ALL
  USING (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE story_images IS 'AI-generated illustrations for stories. Requires Supabase Storage bucket "story-images" with public access.';
