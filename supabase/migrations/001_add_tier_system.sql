-- Phase 1: Add Tier System and Usage Tracking
-- This migration extends the existing schema without breaking current functionality

-- Add new tier enum (extends existing subscription_status)
CREATE TYPE subscription_tier AS ENUM (
  'free',
  'dream_weaver',
  'magic_circle',
  'enchanted_library'
);

-- Add new columns to users table
ALTER TABLE users
  ADD COLUMN subscription_tier subscription_tier DEFAULT 'free',
  ADD COLUMN stripe_subscription_id TEXT,
  ADD COLUMN subscription_period_start TIMESTAMPTZ,
  ADD COLUMN current_period_end TIMESTAMPTZ;

-- Migrate existing data: 'premium' -> 'magic_circle', 'free' -> 'free'
UPDATE users
SET subscription_tier = CASE
  WHEN subscription_status = 'premium' THEN 'magic_circle'::subscription_tier
  WHEN subscription_status = 'trial' THEN 'dream_weaver'::subscription_tier
  ELSE 'free'::subscription_tier
END;

-- Create tier limits configuration table
CREATE TABLE tier_limits (
  tier_name subscription_tier PRIMARY KEY,
  monthly_stories INTEGER NOT NULL,
  monthly_premium_voices INTEGER NOT NULL,
  max_children INTEGER NOT NULL, -- -1 = unlimited
  max_saved_stories INTEGER NOT NULL, -- -1 = unlimited
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier configurations
INSERT INTO tier_limits (tier_name, monthly_stories, monthly_premium_voices, max_children, max_saved_stories, features) VALUES
  ('free', 3, 0, 2, 5, '{"web_voice_only": true}'::jsonb),
  ('dream_weaver', 10, 3, 3, -1, '{"downloads": true, "basic_themes": true}'::jsonb),
  ('magic_circle', 30, 15, 5, -1, '{"family_sharing": 2, "premium_themes": true, "scheduled_delivery": true, "analytics": true, "pdf_download": true, "mp3_download": true}'::jsonb),
  ('enchanted_library', 60, 60, -1, -1, '{"family_sharing": 4, "character_voices": true, "custom_themes": true, "priority_support": true, "early_access": true, "gift_per_year": 1}'::jsonb);

-- Create usage tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  stories_generated INTEGER DEFAULT 0,
  premium_voices_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, billing_period_start)
);

-- Index for fast lookups
CREATE INDEX idx_usage_tracking_user_period ON usage_tracking(user_id, billing_period_start);

-- Enable RLS
ALTER TABLE tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Tier limits are public (everyone can read)
CREATE POLICY "Tier limits are public" ON tier_limits FOR SELECT USING (true);

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Trigger for updated_at
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add voice_provider column to stories table
ALTER TABLE stories
  ADD COLUMN voice_provider VARCHAR(20) DEFAULT 'web', -- 'web' or 'elevenlabs'
  ADD COLUMN voice_config JSONB;

CREATE INDEX idx_stories_voice_provider ON stories(voice_provider);

-- Comment on migration
COMMENT ON TYPE subscription_tier IS 'Phase 1: Subscription tiers for monetization system';
COMMENT ON TABLE tier_limits IS 'Phase 1: Configuration for tier limits and features';
COMMENT ON TABLE usage_tracking IS 'Phase 1: Track user story generation and premium voice usage per billing period';
