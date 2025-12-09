-- =============================================================================
-- Migration: Add Generation Jobs Table
-- Purpose: Track async job status for background processing (Inngest)
-- =============================================================================

-- Create generation_jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('story', 'audio', 'images', 'video')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT,
  result_id UUID, -- References the created resource (story_id, audio_id, etc.)
  error_message TEXT,
  params JSONB, -- Store job parameters for retry/debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_status ON generation_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
  ON generation_jobs FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can insert own jobs"
  ON generation_jobs FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Service role can do everything (for Inngest background jobs)
CREATE POLICY "Service role full access"
  ON generation_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- Function: Increment stories_used in user_subscriptions
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_stories_used(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    stories_used = stories_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no subscription exists, this is a no-op (free users are tracked differently)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function: Increment premium_voices_used in user_subscriptions
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_premium_voices_used(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    premium_voices_used = premium_voices_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Trigger: Auto-update updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_generation_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER trigger_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_jobs_updated_at();

-- =============================================================================
-- Add usage_records table for detailed tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'story_generation',
    'audio_generation',
    'image_generation',
    'video_generation',
    'premium_voice_used'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_action_type ON usage_records(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at DESC);

-- Enable RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Service role full access on usage"
  ON usage_records FOR ALL
  USING (auth.role() = 'service_role');
