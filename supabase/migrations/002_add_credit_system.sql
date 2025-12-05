-- Phase 2: Credit System Migration
-- This migration adds the credit-based monetization system
-- Works alongside the existing tier system for hybrid monetization

-- =============================================================================
-- CREDIT ACCOUNTS TABLE
-- =============================================================================
-- Stores the credit balance for each user

CREATE TABLE credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_credits INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_credits >= 0),
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_credit_accounts_user_id ON credit_accounts(user_id);
CREATE INDEX idx_credit_accounts_tier ON credit_accounts(tier);

-- =============================================================================
-- CREDIT TRANSACTIONS TABLE
-- =============================================================================
-- Audit log of all credit movements

CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',      -- Bought credits
  'usage',         -- Used credits for generation
  'bonus',         -- Welcome bonus, promotions
  'refund',        -- Refunded credits
  'gift',          -- Gifted credits
  'subscription',  -- Credits from subscription
  'adjustment'     -- Manual adjustment
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  type credit_transaction_type NOT NULL,
  description TEXT,
  related_entity_id UUID, -- Story ID, purchase ID, etc.
  related_entity_type VARCHAR(50), -- 'story', 'purchase', 'subscription'
  metadata JSONB DEFAULT '{}'::jsonb,
  balance_after INTEGER, -- Snapshot of balance after transaction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transaction queries
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- =============================================================================
-- CREDIT PACKAGES TABLE
-- =============================================================================
-- Available credit packages for purchase

CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0), -- Price in cents
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_price_id VARCHAR(100), -- Stripe Price ID
  bonus_credits INTEGER DEFAULT 0, -- Extra credits as bonus
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active packages
CREATE INDEX idx_credit_packages_active ON credit_packages(is_active, sort_order);

-- Insert default credit packages
INSERT INTO credit_packages (name, description, credits, price_cents, bonus_credits, is_featured, sort_order) VALUES
  ('Starter Pack', 'Perfect for trying out MyAmari', 10, 499, 0, false, 1),
  ('Story Bundle', 'Great value for regular storytelling', 50, 1999, 5, true, 2),
  ('Family Pack', 'Best for active families', 150, 4999, 25, false, 3),
  ('Ultimate Library', 'Maximum creativity unleashed', 500, 14999, 100, false, 4);

-- =============================================================================
-- CREDIT COSTS CONFIGURATION TABLE
-- =============================================================================
-- Configurable credit costs for different operations

CREATE TABLE credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation VARCHAR(100) NOT NULL UNIQUE,
  base_cost INTEGER NOT NULL CHECK (base_cost >= 0),
  description TEXT,
  category VARCHAR(50), -- 'story', 'image', 'audio', 'video'
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default credit costs
INSERT INTO credit_costs (operation, base_cost, description, category) VALUES
  -- Story generation
  ('story_short', 1, 'Short story (4 pages)', 'story'),
  ('story_medium', 2, 'Medium story (6 pages)', 'story'),
  ('story_long', 3, 'Long story (8 pages)', 'story'),

  -- Image generation
  ('illustration_standard', 1, 'Standard quality illustration', 'image'),
  ('illustration_premium', 2, 'Premium quality illustration', 'image'),

  -- Audio narration
  ('narration_basic', 1, 'Basic TTS narration', 'audio'),
  ('narration_premium', 3, 'Premium ElevenLabs narration', 'audio'),

  -- Video generation
  ('video_short', 5, 'Short video (15-30 sec)', 'video'),
  ('video_medium', 10, 'Medium video (30-60 sec)', 'video'),
  ('video_long', 20, 'Long video (1-2 min)', 'video');

-- =============================================================================
-- CREDIT PURCHASES TABLE
-- =============================================================================
-- Records of credit purchases

CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES credit_packages(id),
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(100),
  stripe_checkout_session_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for purchase queries
CREATE INDEX idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX idx_credit_purchases_stripe_session ON credit_purchases(stripe_checkout_session_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all credit tables
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Credit accounts: users can only view their own
CREATE POLICY "Users can view own credit account" ON credit_accounts
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Credit transactions: users can only view their own
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Credit packages: public read access
CREATE POLICY "Credit packages are public" ON credit_packages
  FOR SELECT USING (is_active = true);

-- Credit costs: public read access
CREATE POLICY "Credit costs are public" ON credit_costs
  FOR SELECT USING (is_active = true);

-- Credit purchases: users can only view their own
CREATE POLICY "Users can view own purchases" ON credit_purchases
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for updated_at on credit_accounts
CREATE TRIGGER update_credit_accounts_updated_at
  BEFORE UPDATE ON credit_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on credit_packages
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on credit_costs
CREATE TRIGGER update_credit_costs_updated_at
  BEFORE UPDATE ON credit_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to create credit account for new users with welcome bonus
CREATE OR REPLACE FUNCTION create_credit_account_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_accounts (user_id, balance, lifetime_credits, tier)
  VALUES (NEW.id, 10, 10, 'free'); -- 10 welcome credits

  -- Record welcome bonus transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
  VALUES (NEW.id, 10, 'bonus', 'Welcome bonus credits', 10);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create credit account for new users
CREATE TRIGGER create_credit_account_on_user_insert
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_credit_account_for_user();

-- Function to deduct credits (atomic operation)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID, error_message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the credit account row for update
  SELECT balance INTO v_current_balance
  FROM credit_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if account exists
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, NULL::UUID, 'Credit account not found';
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID,
      format('Insufficient credits. Required: %s, Available: %s', p_amount, v_current_balance);
    RETURN;
  END IF;

  -- Deduct credits
  v_new_balance := v_current_balance - p_amount;

  UPDATE credit_accounts
  SET balance = v_new_balance, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, amount, type, description,
    related_entity_id, related_entity_type, balance_after
  )
  VALUES (
    p_user_id, -p_amount, 'usage', p_reason,
    p_related_entity_id, p_related_entity_type, v_new_balance
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, v_new_balance, v_transaction_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (atomic operation)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_transaction_type,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID, error_message TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
  v_current_lifetime INTEGER;
  v_new_balance INTEGER;
  v_new_lifetime INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Lock the credit account row for update
  SELECT balance, lifetime_credits INTO v_current_balance, v_current_lifetime
  FROM credit_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if account exists
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, NULL::UUID, 'Credit account not found';
    RETURN;
  END IF;

  -- Add credits
  v_new_balance := v_current_balance + p_amount;
  v_new_lifetime := CASE WHEN p_type = 'purchase' THEN v_current_lifetime + p_amount ELSE v_current_lifetime END;

  UPDATE credit_accounts
  SET
    balance = v_new_balance,
    lifetime_credits = v_new_lifetime,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, amount, type, description, metadata, balance_after
  )
  VALUES (
    p_user_id, p_amount, p_type, p_description, p_metadata, v_new_balance
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, v_new_balance, v_transaction_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View for user credit summary
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT
  ca.user_id,
  ca.balance,
  ca.lifetime_credits,
  ca.tier,
  ca.created_at as account_created,
  (SELECT COUNT(*) FROM credit_transactions ct WHERE ct.user_id = ca.user_id) as total_transactions,
  (SELECT COALESCE(SUM(ABS(amount)), 0) FROM credit_transactions ct WHERE ct.user_id = ca.user_id AND ct.type = 'usage') as total_spent,
  (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions ct WHERE ct.user_id = ca.user_id AND ct.type = 'purchase') as total_purchased
FROM credit_accounts ca;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE credit_accounts IS 'Phase 2: User credit balances for pay-as-you-go monetization';
COMMENT ON TABLE credit_transactions IS 'Phase 2: Audit log of all credit movements';
COMMENT ON TABLE credit_packages IS 'Phase 2: Available credit packages for purchase';
COMMENT ON TABLE credit_costs IS 'Phase 2: Configurable credit costs per operation';
COMMENT ON TABLE credit_purchases IS 'Phase 2: Purchase records for Stripe integration';
COMMENT ON FUNCTION deduct_credits IS 'Atomic credit deduction with balance check';
COMMENT ON FUNCTION add_credits IS 'Atomic credit addition with lifetime tracking';
