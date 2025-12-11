-- Migration: Add Family Universe & Character Persistence
-- Date: 2025-12-11
-- Description: Enable character persistence and family story universe tracking

-- =============================================================================
-- CHARACTERS TABLE
-- =============================================================================
-- Store recurring characters that can be reused across stories

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT CHECK (gender IN ('boy', 'girl', 'other')),
  age_range TEXT CHECK (age_range IN ('baby', 'toddler', 'child', 'teen', 'adult', 'elderly')),

  -- Character details
  description TEXT, -- Physical description for illustrations
  personality TEXT, -- Personality traits
  favorite_things TEXT[], -- Array of favorite items, activities
  role TEXT DEFAULT 'protagonist' CHECK (role IN ('protagonist', 'sidekick', 'pet', 'family', 'friend', 'mentor', 'magical')),

  -- Visual reference (for consistent illustrations)
  avatar_url TEXT,
  illustration_style TEXT, -- Preferred art style for this character

  -- Stats
  stories_count INTEGER DEFAULT 0,
  last_appeared_at TIMESTAMPTZ,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for characters
CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(user_id, name);

-- =============================================================================
-- STORY_CHARACTERS JOIN TABLE
-- =============================================================================
-- Track which characters appear in which stories

CREATE TABLE IF NOT EXISTS story_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role_in_story TEXT, -- Their specific role in this story
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(story_id, character_id)
);

CREATE INDEX IF NOT EXISTS idx_story_characters_story ON story_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_character ON story_characters(character_id);

-- =============================================================================
-- FAMILY UNIVERSE TABLE
-- =============================================================================
-- Aggregate stats and settings for each family's story universe

CREATE TABLE IF NOT EXISTS family_universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Universe name and theme
  universe_name TEXT DEFAULT 'My Story Universe',
  description TEXT,

  -- Aggregate stats (updated via triggers/functions)
  total_stories INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  total_words_generated INTEGER DEFAULT 0,
  favorite_themes TEXT[], -- Most used themes

  -- Universe settings
  default_art_style TEXT DEFAULT 'storybook',
  default_tone TEXT DEFAULT 'bedtime-calm',
  enable_character_continuity BOOLEAN DEFAULT true, -- AI remembers characters
  enable_story_callbacks BOOLEAN DEFAULT true, -- Reference previous adventures

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_universes_user ON family_universes(user_id);

-- =============================================================================
-- STORY MEMORIES TABLE
-- =============================================================================
-- Store summaries/memories from stories for AI context

CREATE TABLE IF NOT EXISTS story_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,

  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('adventure', 'lesson', 'character_moment', 'location', 'relationship')),
  summary TEXT NOT NULL, -- Short summary for AI context
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10), -- For prioritizing memories

  -- Characters involved
  character_ids UUID[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_memories_user ON story_memories(user_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_story_memories_type ON story_memories(user_id, memory_type);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get or create family universe for a user
CREATE OR REPLACE FUNCTION get_or_create_universe(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_universe_id UUID;
BEGIN
  SELECT id INTO v_universe_id FROM family_universes WHERE user_id = p_user_id;

  IF v_universe_id IS NULL THEN
    INSERT INTO family_universes (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_universe_id;
  END IF;

  RETURN v_universe_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update character stats when they appear in a story
CREATE OR REPLACE FUNCTION update_character_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE characters
  SET
    stories_count = stories_count + 1,
    last_appeared_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.character_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for character stats
DROP TRIGGER IF EXISTS trigger_update_character_stats ON story_characters;
CREATE TRIGGER trigger_update_character_stats
  AFTER INSERT ON story_characters
  FOR EACH ROW
  EXECUTE FUNCTION update_character_stats();

-- Function to update universe stats
CREATE OR REPLACE FUNCTION update_universe_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE family_universes
  SET
    total_stories = total_stories + 1,
    total_words_generated = total_words_generated + COALESCE(NEW.word_count, 0),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for universe stats on new story
DROP TRIGGER IF EXISTS trigger_update_universe_stats ON stories;
CREATE TRIGGER trigger_update_universe_stats
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_universe_stats();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE characters IS 'Recurring characters that can appear in multiple stories';
COMMENT ON TABLE story_characters IS 'Join table tracking which characters appear in which stories';
COMMENT ON TABLE family_universes IS 'Aggregate stats and settings for each family story universe';
COMMENT ON TABLE story_memories IS 'AI-generated summaries from stories for context in future story generation';
