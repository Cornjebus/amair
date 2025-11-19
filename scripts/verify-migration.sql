-- Verify tier system migration
-- Check if new columns exist on users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('subscription_tier', 'stripe_subscription_id', 'subscription_period_start', 'current_period_end');

-- Check if tier_limits table exists
SELECT * FROM tier_limits ORDER BY tier_name;

-- Check if usage_tracking table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'usage_tracking';
