-- =============================================================================
-- Migration: Add Story Audio Support
-- Purpose: Store audio narrations for stories (ElevenLabs integration)
-- =============================================================================

-- Add audio_url column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create story_audio table for detailed audio tracking
CREATE TABLE IF NOT EXISTS story_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voice_id VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  duration_seconds INTEGER,
  is_premium_voice BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_audio_story_id ON story_audio(story_id);
CREATE INDEX IF NOT EXISTS idx_story_audio_user_id ON story_audio(user_id);

-- Enable RLS
ALTER TABLE story_audio ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own audio
CREATE POLICY "Users can view own audio"
  ON story_audio FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own audio"
  ON story_audio FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Service role can do everything (for Inngest background jobs)
CREATE POLICY "Service role full access on audio"
  ON story_audio FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Storage bucket for audio files
-- Note: This needs to be created manually in Supabase Dashboard
-- Bucket name: story-audio
-- Public: true (for playback)
-- =============================================================================

-- Comment for manual setup
COMMENT ON TABLE story_audio IS 'Audio narrations for stories. Requires Supabase Storage bucket "story-audio" to be created manually with public access.';
