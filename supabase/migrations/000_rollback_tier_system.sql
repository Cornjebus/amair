-- ROLLBACK for Phase 1: Add Tier System
-- Run this file if you need to rollback the tier system migration

-- Drop indexes
DROP INDEX IF EXISTS idx_stories_voice_provider;
DROP INDEX IF EXISTS idx_usage_tracking_user_period;

-- Drop triggers
DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;

-- Drop policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
DROP POLICY IF EXISTS "Tier limits are public" ON tier_limits;

-- Drop tables
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS tier_limits CASCADE;

-- Remove columns from stories
ALTER TABLE stories DROP COLUMN IF EXISTS voice_provider;
ALTER TABLE stories DROP COLUMN IF EXISTS voice_config;

-- Remove columns from users
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_period_start;
ALTER TABLE users DROP COLUMN IF EXISTS current_period_end;

-- Drop type
DROP TYPE IF EXISTS subscription_tier;

-- Note: This does NOT rollback data changes to subscription_status
-- Existing users will keep their subscription_status values
