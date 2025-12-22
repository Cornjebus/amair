-- Migration: Add Story Ratings and Quality Scoring
-- Date: 2024-12-18
-- Description: Add rating system, quality scoring, and regeneration tracking for stories

-- =============================================================================
-- ADD COLUMNS TO STORIES TABLE
-- =============================================================================

-- User ratings (1-5 stars)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- Regeneration tracking
ALTER TABLE stories ADD COLUMN IF NOT EXISTS regeneration_count INTEGER DEFAULT 0 CHECK (regeneration_count >= 0);

-- Quality scoring (0-100)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- Metadata for storing original request parameters (JSON)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

-- Index for finding rated stories
CREATE INDEX IF NOT EXISTS idx_stories_rating ON stories(user_id, rating) WHERE rating IS NOT NULL;

-- Index for finding stories by quality score
CREATE INDEX IF NOT EXISTS idx_stories_quality ON stories(user_id, quality_score DESC) WHERE quality_score IS NOT NULL;

-- Index for finding recently rated stories
CREATE INDEX IF NOT EXISTS idx_stories_rated_at ON stories(user_id, rated_at DESC) WHERE rated_at IS NOT NULL;

-- Index for metadata queries (useful for filtering by original parameters)
CREATE INDEX IF NOT EXISTS idx_stories_metadata ON stories USING GIN (metadata);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate average rating for a user
CREATE OR REPLACE FUNCTION get_user_average_rating(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2)
  INTO v_avg_rating
  FROM stories
  WHERE user_id = p_user_id
    AND rating IS NOT NULL;

  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get rating distribution for a user
CREATE OR REPLACE FUNCTION get_user_rating_distribution(p_user_id UUID)
RETURNS TABLE (
  rating INTEGER,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.rating, COUNT(*)::BIGINT
  FROM stories s
  WHERE s.user_id = p_user_id
    AND s.rating IS NOT NULL
  GROUP BY s.rating
  ORDER BY s.rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get quality statistics for a user
CREATE OR REPLACE FUNCTION get_user_quality_stats(p_user_id UUID)
RETURNS TABLE (
  avg_quality NUMERIC,
  min_quality INTEGER,
  max_quality INTEGER,
  total_scored BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(quality_score)::NUMERIC(5,2),
    MIN(quality_score),
    MAX(quality_score),
    COUNT(*)::BIGINT
  FROM stories
  WHERE user_id = p_user_id
    AND quality_score IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a story can be regenerated
CREATE OR REPLACE FUNCTION can_regenerate_story(p_story_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_regeneration_count INTEGER;
  v_max_regenerations INTEGER := 3;
BEGIN
  SELECT regeneration_count
  INTO v_regeneration_count
  FROM stories
  WHERE id = p_story_id;

  IF v_regeneration_count IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_regeneration_count < v_max_regenerations;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- =============================================================================

-- Ensure updated_at is updated when rating is added
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stories_rating_update ON stories;
CREATE TRIGGER trigger_stories_rating_update
  BEFORE UPDATE OF rating, feedback, quality_score, regeneration_count ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN stories.rating IS 'User rating from 1-5 stars (NULL if not rated)';
COMMENT ON COLUMN stories.feedback IS 'Optional text feedback from user about the story';
COMMENT ON COLUMN stories.rated_at IS 'Timestamp when the story was rated by the user';
COMMENT ON COLUMN stories.regeneration_count IS 'Number of times this story has been regenerated (max 3)';
COMMENT ON COLUMN stories.quality_score IS 'Automated quality score from 0-100 based on story analysis';
COMMENT ON COLUMN stories.metadata IS 'JSON metadata storing original request parameters (storyRequest, ageGroup, style, etc.)';
