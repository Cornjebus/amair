-- Migration: Add AI provider tracking to stories table
-- Date: 2025-12-11
-- Description: Track which AI provider and model generated each story

-- Add AI provider tracking columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'openai';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS ai_model TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_cost DECIMAL(10,6);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS tokens_used INTEGER;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_stories_ai_provider ON stories(ai_provider);

-- Add provider preferences to users (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_ai_provider TEXT DEFAULT 'anthropic';

-- Create generation_costs table for detailed cost tracking
CREATE TABLE IF NOT EXISTS generation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'story', 'image', 'audio', 'video'
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd DECIMAL(10,6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for cost tracking queries
CREATE INDEX IF NOT EXISTS idx_generation_costs_user ON generation_costs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_costs_operation ON generation_costs(operation, created_at DESC);

-- Comment for documentation
COMMENT ON COLUMN stories.ai_provider IS 'The AI provider used to generate this story (anthropic, openai)';
COMMENT ON COLUMN stories.ai_model IS 'The specific model used (e.g., claude-sonnet-4-5-20250514, gpt-4o)';
COMMENT ON COLUMN stories.generation_cost IS 'Estimated cost in USD for generating this story';
COMMENT ON COLUMN stories.tokens_used IS 'Total tokens used (input + output)';
