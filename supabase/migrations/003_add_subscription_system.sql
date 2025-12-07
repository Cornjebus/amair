-- Phase 5: Full Subscription System with Gift Support
-- Replaces credit-based system with subscription tiers + gift subscriptions

-- =============================================================================
-- SUBSCRIPTION PRICING TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier subscription_tier NOT NULL,
  billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  stripe_price_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier, billing_cycle)
);

-- Insert subscription prices (from PRD)
INSERT INTO subscription_prices (tier, billing_cycle, price_cents, currency) VALUES
  -- Free tier (no price)
  ('free', 'monthly', 0, 'usd'),
  -- Dream Weaver
  ('dream_weaver', 'monthly', 699, 'usd'),    -- $6.99/mo
  ('dream_weaver', 'annual', 5999, 'usd'),    -- $59.99/yr ($4.99/mo effective)
  -- Magic Circle
  ('magic_circle', 'monthly', 1499, 'usd'),   -- $14.99/mo
  ('magic_circle', 'annual', 11999, 'usd'),   -- $119.99/yr ($9.99/mo effective)
  -- Enchanted Library
  ('enchanted_library', 'monthly', 2999, 'usd'), -- $29.99/mo
  ('enchanted_library', 'annual', 24999, 'usd'); -- $249.99/yr ($20.83/mo effective)

-- =============================================================================
-- USER SUBSCRIPTIONS TABLE (replaces simple tier on users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'annual', 'gift', 'free')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused', 'trialing')),

  -- Billing period tracking
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),

  -- Usage tracking for current period
  stories_used INTEGER DEFAULT 0,
  premium_voices_used INTEGER DEFAULT 0,

  -- Stripe integration
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),

  -- Gift tracking
  gift_subscription_id UUID, -- References gift_subscriptions if from gift

  -- Cancellation tracking
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One active subscription per user
  UNIQUE(user_id)
);

-- =============================================================================
-- GIFT PACKAGES TABLE (pricing for gifts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS gift_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  tier subscription_tier NOT NULL,
  duration_months INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert gift packages (from PRD)
INSERT INTO gift_packages (name, slug, tier, duration_months, price_cents, description, display_order) VALUES
  -- Dream Weaver Gifts
  ('Starter Magic', 'starter-magic', 'dream_weaver', 3, 2499, '3 months of Dream Weaver - Perfect for trying Amari', 1),
  ('Holiday Bundle', 'holiday-bundle', 'dream_weaver', 6, 4499, '6 months of Dream Weaver - Great holiday gift', 2),
  ('Year of Dreams', 'year-of-dreams', 'dream_weaver', 12, 7999, 'Full year of Dream Weaver - Best value starter', 3),
  -- Magic Circle Gifts
  ('Premium Gift', 'premium-gift', 'magic_circle', 3, 4999, '3 months of Magic Circle - Premium storytelling', 4),
  ('Magic Half-Year', 'magic-half-year', 'magic_circle', 6, 8999, '6 months of Magic Circle - Extended magic', 5),
  ('Annual Magic', 'annual-magic', 'magic_circle', 12, 17999, 'Full year of Magic Circle - Complete experience', 6),
  -- Enchanted Library Gift
  ('Ultimate Library', 'ultimate-library', 'enchanted_library', 12, 21999, 'Full year of Enchanted Library - The ultimate gift', 7);

-- =============================================================================
-- GIFT SUBSCRIPTIONS TABLE (purchased gifts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Purchaser info
  purchaser_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for guest purchases
  purchaser_email VARCHAR(255) NOT NULL,
  purchaser_name VARCHAR(255),

  -- Gift package details
  gift_package_id UUID NOT NULL REFERENCES gift_packages(id),
  tier subscription_tier NOT NULL,
  duration_months INTEGER NOT NULL,
  price_paid_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Redemption tracking
  redemption_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'refunded')),

  -- Recipient info (optional at purchase, filled on redemption)
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Gift message (optional)
  gift_message TEXT,
  delivery_date DATE, -- For scheduled delivery

  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'), -- Gift codes expire after 1 year

  -- Stripe tracking
  stripe_checkout_session_id VARCHAR(100),
  stripe_payment_intent_id VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SUBSCRIPTION HISTORY TABLE (for auditing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'gift_redeemed'
  from_tier subscription_tier,
  to_tier subscription_tier,
  billing_cycle VARCHAR(10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_code ON gift_subscriptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_status ON gift_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser ON gift_subscriptions(purchaser_user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscription prices are public
CREATE POLICY "Subscription prices are public" ON subscription_prices
  FOR SELECT USING (true);

-- Gift packages are public
CREATE POLICY "Gift packages are public" ON gift_packages
  FOR SELECT USING (true);

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- Users can view gifts they purchased or received
CREATE POLICY "Users can view own gifts" ON gift_subscriptions
  FOR SELECT USING (
    purchaser_user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    OR recipient_user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- Users can view their own subscription history
CREATE POLICY "Users can view own history" ON subscription_history
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to generate unique gift redemption codes
CREATE OR REPLACE FUNCTION generate_gift_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars
  result VARCHAR(20) := '';
  i INTEGER;
BEGIN
  -- Format: GIFT-XXXX-XXXX-XXXX
  result := 'GIFT-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can generate a story (within limits)
CREATE OR REPLACE FUNCTION can_generate_story(p_user_id UUID, p_use_premium_voice BOOLEAN DEFAULT false)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  stories_remaining INTEGER,
  premium_voices_remaining INTEGER
) AS $$
DECLARE
  v_sub RECORD;
  v_limits RECORD;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_sub FROM user_subscriptions WHERE user_id = p_user_id;

  -- If no subscription, create free tier
  IF v_sub IS NULL THEN
    INSERT INTO user_subscriptions (user_id, tier, billing_cycle, status)
    VALUES (p_user_id, 'free', 'free', 'active')
    RETURNING * INTO v_sub;
  END IF;

  -- Check if subscription is active
  IF v_sub.status NOT IN ('active', 'trialing') THEN
    RETURN QUERY SELECT false, 'Subscription is not active', 0, 0;
    RETURN;
  END IF;

  -- Check if within billing period
  IF NOW() > v_sub.current_period_end THEN
    RETURN QUERY SELECT false, 'Billing period has ended', 0, 0;
    RETURN;
  END IF;

  -- Get tier limits
  SELECT * INTO v_limits FROM tier_limits WHERE tier_name = v_sub.tier;

  -- Check story limit
  IF v_sub.stories_used >= v_limits.monthly_stories THEN
    RETURN QUERY SELECT false, 'Monthly story limit reached', 0,
      GREATEST(0, v_limits.monthly_premium_voices - v_sub.premium_voices_used);
    RETURN;
  END IF;

  -- Check premium voice limit if requested
  IF p_use_premium_voice AND v_sub.premium_voices_used >= v_limits.monthly_premium_voices THEN
    RETURN QUERY SELECT false, 'Monthly premium voice limit reached',
      GREATEST(0, v_limits.monthly_stories - v_sub.stories_used), 0;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, 'OK',
    GREATEST(0, v_limits.monthly_stories - v_sub.stories_used),
    GREATEST(0, v_limits.monthly_premium_voices - v_sub.premium_voices_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record story generation
CREATE OR REPLACE FUNCTION record_story_generation(
  p_user_id UUID,
  p_used_premium_voice BOOLEAN DEFAULT false
)
RETURNS TABLE (
  success BOOLEAN,
  stories_remaining INTEGER,
  premium_voices_remaining INTEGER
) AS $$
DECLARE
  v_limits RECORD;
  v_sub RECORD;
BEGIN
  -- Get and lock user's subscription
  SELECT * INTO v_sub FROM user_subscriptions
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_sub IS NULL THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Increment usage
  UPDATE user_subscriptions
  SET
    stories_used = stories_used + 1,
    premium_voices_used = CASE WHEN p_used_premium_voice THEN premium_voices_used + 1 ELSE premium_voices_used END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_sub;

  -- Get limits for return values
  SELECT * INTO v_limits FROM tier_limits WHERE tier_name = v_sub.tier;

  RETURN QUERY SELECT true,
    GREATEST(0, v_limits.monthly_stories - v_sub.stories_used),
    GREATEST(0, v_limits.monthly_premium_voices - v_sub.premium_voices_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem a gift code
CREATE OR REPLACE FUNCTION redeem_gift_code(
  p_user_id UUID,
  p_redemption_code VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  tier subscription_tier,
  duration_months INTEGER,
  new_period_end TIMESTAMPTZ
) AS $$
DECLARE
  v_gift RECORD;
  v_current_sub RECORD;
  v_new_end TIMESTAMPTZ;
BEGIN
  -- Find and lock the gift
  SELECT * INTO v_gift FROM gift_subscriptions
  WHERE redemption_code = UPPER(p_redemption_code) FOR UPDATE;

  IF v_gift IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid gift code', NULL::subscription_tier, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v_gift.status != 'pending' THEN
    RETURN QUERY SELECT false, 'Gift code has already been ' || v_gift.status, NULL::subscription_tier, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v_gift.expires_at < NOW() THEN
    UPDATE gift_subscriptions SET status = 'expired' WHERE id = v_gift.id;
    RETURN QUERY SELECT false, 'Gift code has expired', NULL::subscription_tier, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Calculate new period end
  v_new_end := NOW() + (v_gift.duration_months || ' months')::INTERVAL;

  -- Update or insert user subscription
  INSERT INTO user_subscriptions (
    user_id, tier, billing_cycle, status,
    current_period_start, current_period_end,
    stories_used, premium_voices_used,
    gift_subscription_id
  ) VALUES (
    p_user_id, v_gift.tier, 'gift', 'active',
    NOW(), v_new_end,
    0, 0,
    v_gift.id
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = v_gift.tier,
    billing_cycle = 'gift',
    status = 'active',
    current_period_start = NOW(),
    current_period_end = v_new_end,
    stories_used = 0,
    premium_voices_used = 0,
    gift_subscription_id = v_gift.id,
    updated_at = NOW();

  -- Mark gift as redeemed
  UPDATE gift_subscriptions SET
    status = 'redeemed',
    recipient_user_id = p_user_id,
    redeemed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_gift.id;

  -- Record in history
  INSERT INTO subscription_history (user_id, event_type, to_tier, metadata)
  VALUES (p_user_id, 'gift_redeemed', v_gift.tier, jsonb_build_object(
    'gift_id', v_gift.id,
    'duration_months', v_gift.duration_months,
    'redemption_code', p_redemption_code
  ));

  RETURN QUERY SELECT true, 'Gift redeemed successfully', v_gift.tier, v_gift.duration_months, v_new_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage at period end (called by cron/webhook)
CREATE OR REPLACE FUNCTION reset_subscription_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET
    stories_used = 0,
    premium_voices_used = 0,
    current_period_start = current_period_end,
    current_period_end = current_period_end +
      CASE billing_cycle
        WHEN 'annual' THEN INTERVAL '1 year'
        ELSE INTERVAL '1 month'
      END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_subscription_prices_updated_at
  BEFORE UPDATE ON subscription_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_subscriptions_updated_at
  BEFORE UPDATE ON gift_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE subscription_prices IS 'Pricing for subscription tiers (monthly and annual)';
COMMENT ON TABLE user_subscriptions IS 'Active user subscriptions with usage tracking';
COMMENT ON TABLE gift_packages IS 'Available gift subscription packages for purchase';
COMMENT ON TABLE gift_subscriptions IS 'Purchased gift subscriptions with redemption tracking';
COMMENT ON TABLE subscription_history IS 'Audit log of subscription changes';
COMMENT ON FUNCTION can_generate_story IS 'Check if user can generate a story within their subscription limits';
COMMENT ON FUNCTION record_story_generation IS 'Record that a user generated a story, incrementing usage counters';
COMMENT ON FUNCTION redeem_gift_code IS 'Redeem a gift subscription code for a user';
