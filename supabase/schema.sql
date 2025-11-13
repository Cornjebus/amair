-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('free', 'premium', 'trial');
CREATE TYPE story_tone AS ENUM ('bedtime-calm', 'funny', 'adventure', 'mystery');
CREATE TYPE story_length AS ENUM ('quick', 'medium', 'epic');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_status subscription_status DEFAULT 'free',
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE
);

-- Children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tone story_tone NOT NULL,
  length story_length NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  word_count INTEGER NOT NULL
);

-- Story seeds (the random items used to create each story)
CREATE TABLE story_seeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  seed_items TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_items TEXT[] NOT NULL,
  child_story TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_story_seeds_story_id ON story_seeds(story_id);
CREATE INDEX idx_daily_challenges_user_id ON daily_challenges(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Children policies
CREATE POLICY "Users can view own children" ON children FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own children" ON children FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own children" ON children FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own children" ON children FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Stories policies
CREATE POLICY "Users can view own stories" ON stories FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own stories" ON stories FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own stories" ON stories FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can delete own stories" ON stories FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Story seeds policies
CREATE POLICY "Users can view own story seeds" ON story_seeds FOR SELECT USING (story_id IN (SELECT id FROM stories WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));
CREATE POLICY "Users can insert own story seeds" ON story_seeds FOR INSERT WITH CHECK (story_id IN (SELECT id FROM stories WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')));

-- Daily challenges policies
CREATE POLICY "Users can view own challenges" ON daily_challenges FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can insert own challenges" ON daily_challenges FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can update own challenges" ON daily_challenges FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
