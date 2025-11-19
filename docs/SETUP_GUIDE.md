# Amari Monetization Setup Guide

This guide walks you through setting up the multi-tier subscription system for Amari.

---

## Prerequisites

- [ ] Supabase project set up and linked
- [ ] Stripe account with test mode enabled
- [ ] Vercel project configured
- [ ] Environment variables ready

---

## Step 1: Database Migration

### Apply the Tier System Migration

```bash
# 1. Link your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# 2. Check current schema status
supabase db diff

# 3. Apply the migration
supabase db push

# 4. Verify the migration was successful
# Check the Supabase dashboard > Table Editor
# You should see:
# - users table with new columns (subscription_tier, stripe_subscription_id, etc.)
# - tier_limits table with 4 rows
# - usage_tracking table (empty)
# - stories table with voice_provider column
```

### Verify Migration Success

Run this SQL query in Supabase SQL Editor:

```sql
-- Check tier limits are configured
SELECT tier_name, monthly_stories, monthly_premium_voices, max_children
FROM tier_limits
ORDER BY tier_name;

-- Should return:
-- dream_weaver    | 10 | 3  | 3
-- enchanted_library| 60 | 60 | -1
-- free            | 3  | 0  | 2
-- magic_circle    | 30 | 15 | 5

-- Check users table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('subscription_tier', 'stripe_subscription_id', 'subscription_period_start');
```

### Rollback (If Needed)

If something goes wrong:

```bash
supabase db reset

# Or apply the rollback migration manually
psql YOUR_DATABASE_URL -f supabase/migrations/000_rollback_tier_system.sql
```

---

## Step 2: Stripe Product Configuration

### Create Products in Stripe Dashboard

Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/test/products)

#### Product 1: Dream Weaver
1. Click "Add Product"
2. Name: `Dream Weaver`
3. Description: `10 AI-generated stories per month with 3 premium voices`
4. Add two prices:
   - **Monthly**: $6.99 USD, recurring monthly
     - Save the Price ID (starts with `price_`)
   - **Annual**: $59.99 USD, recurring yearly
     - Save the Price ID

#### Product 2: Magic Circle
1. Click "Add Product"
2. Name: `Magic Circle`
3. Description: `30 stories per month with 15 premium voices and family sharing`
4. Add two prices:
   - **Monthly**: $14.99 USD, recurring monthly
   - **Annual**: $119.99 USD, recurring yearly

#### Product 3: Enchanted Library
1. Click "Add Product"
2. Name: `Enchanted Library`
3. Description: `60 stories per month with unlimited premium voices and priority support`
4. Add two prices:
   - **Monthly**: $29.99 USD, recurring monthly
   - **Annual**: $249.99 USD, recurring yearly

### Save All Price IDs

You should now have **6 price IDs**. Keep them handy for Step 3.

---

## Step 3: Environment Variables

### Update `.env.local`

Add these new environment variables:

```env
# Existing variables (keep these)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Dream Weaver Tier
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY=price_xxx_monthly
NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL=price_xxx_annual

# Magic Circle Tier
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY=price_xxx_monthly
NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL=price_xxx_annual

# Enchanted Library Tier
NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY=price_xxx_monthly
NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL=price_xxx_annual
```

### Update Vercel Environment Variables

```bash
# Add all the new price IDs to Vercel
vercel env add NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY
vercel env add NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL
vercel env add NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY
vercel env add NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL
vercel env add NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY
vercel env add NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL

# Redeploy to apply changes
vercel --prod
```

---

## Step 4: Test the System

### Local Testing with Stripe CLI

```bash
# 1. Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli

# 2. Login to Stripe
stripe login

# 3. Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. In another terminal, start your app
npm run dev

# 5. Create a test checkout
# Visit: http://localhost:3000/pricing (once built)
# Or test with API:
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "dream_weaver",
    "billingPeriod": "monthly"
  }'
```

### Test Scenarios

#### Scenario 1: New Subscription
```bash
# Trigger a successful checkout
stripe trigger checkout.session.completed

# Check Supabase users table
# User should have:
# - subscription_tier: dream_weaver
# - subscription_status: premium
# - stripe_subscription_id: sub_xxx
# - current_period_end: (30 days from now)
```

#### Scenario 2: Story Generation with Limits
```typescript
// Test in your app or with API
// 1. Generate 3 stories as free user
// 2. Try 4th story - should be blocked
// 3. Upgrade to dream_weaver
// 4. Generate 10 stories - should work
// 5. Try 11th story - should be blocked
```

#### Scenario 3: Subscription Upgrade
```bash
# 1. Create dream_weaver subscription
# 2. Upgrade to magic_circle
# 3. Check proration invoice in Stripe
# 4. Verify user tier updated in Supabase
```

#### Scenario 4: Billing Period Rollover
```typescript
// Mock test in usage.test.ts
// 1. Track 10 stories in current period
// 2. Advance to next billing period
// 3. Usage should reset to 0
```

---

## Step 5: Run Automated Tests

```bash
# Install test dependencies (if not already installed)
npm install --save-dev @jest/globals jest

# Run all subscription tests
npm test tests/subscription/

# Run specific test suites
npm test tests/subscription/tiers.test.ts
npm test tests/subscription/usage.test.ts
npm test tests/database/migration.test.ts

# Expected output:
# ✓ Tier configuration (8 tests)
# ✓ Usage limits (6 tests)
# ✓ Tier hierarchy (6 tests)
# ✓ Billing period management (3 tests)
# ✓ Usage tracking (8 tests)
# ✓ Database migration (12 tests)
```

---

## Step 6: Integration with Story Generation

### Update Story Generation API

Edit `app/api/generate-story/route.ts`:

```typescript
import { canGenerateStory, trackStoryGeneration } from '@/lib/subscription/usage'
import { getUserSubscription } from '@/lib/subscription/manager'

export async function POST(req: Request) {
  // ... existing auth code ...

  // Get user's subscription
  const subscription = await getUserSubscription(userId)

  // Check if user can generate story
  const usePremiumVoice = body.voiceProvider === 'elevenlabs'
  const canGenerate = await canGenerateStory(
    userId,
    subscription!.tier,
    usePremiumVoice,
    subscription!.current_period_start ? new Date(subscription!.current_period_start) : undefined
  )

  if (!canGenerate.allowed) {
    return NextResponse.json(
      {
        error: canGenerate.reason,
        usage: {
          stories: canGenerate.storyCheck,
          voices: canGenerate.voiceCheck,
        }
      },
      { status: 403 }
    )
  }

  // ... generate story ...

  // Track usage after successful generation
  await trackStoryGeneration(userId, {
    usedPremiumVoice,
    subscriptionPeriodStart: subscription!.current_period_start
      ? new Date(subscription!.current_period_start)
      : undefined
  })

  // Return story with usage info
  return NextResponse.json({
    story: generatedStory,
    usage: {
      stories: {
        used: canGenerate.storyCheck.current + 1,
        limit: canGenerate.storyCheck.limit,
        remaining: canGenerate.storyCheck.remaining - 1,
      }
    }
  })
}
```

---

## Step 7: Verify Webhook Handling

### Test Webhook Events

```bash
# With Stripe CLI listening...

# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test payment failure
stripe trigger invoice.payment_failed

# Check logs
# You should see:
# 🎉 Checkout session completed
# 🔄 Subscription updated
# 🗑️ Subscription deleted
# 💳 Payment failed
```

### Verify Database Updates

After each webhook test, check Supabase:

```sql
-- Check user subscription was updated
SELECT
  clerk_id,
  subscription_tier,
  subscription_status,
  stripe_subscription_id,
  current_period_end
FROM users
WHERE stripe_customer_id = 'cus_xxx';

-- Check usage tracking
SELECT *
FROM usage_tracking
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Step 8: Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Database migration applied to production Supabase
- [ ] Production Stripe products created
- [ ] Environment variables set in Vercel
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] Story generation integration tested

### Deploy to Production

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Implement multi-tier subscription system

- Add database migrations for tier system
- Create tier management and usage tracking
- Update webhook handlers for new tiers
- Add comprehensive test suite
- Update Stripe configuration"

# 2. Push to main branch
git push origin main

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
# Check Vercel logs for any errors
# Test a story generation
# Check Stripe dashboard for events
```

### Configure Production Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret
6. Add to Vercel: `vercel env add STRIPE_WEBHOOK_SECRET production`

---

## Troubleshooting

### Migration Issues

**Problem**: Migration fails with "column already exists"
```bash
# Solution: Check if migration was partially applied
supabase db reset
# Then reapply
supabase db push
```

**Problem**: RLS policies blocking queries
```bash
# Solution: Verify RLS policies
# In Supabase SQL Editor:
SELECT * FROM pg_policies WHERE tablename IN ('tier_limits', 'usage_tracking');
```

### Stripe Issues

**Problem**: Price IDs not working
```bash
# Solution: Verify price IDs are correct
stripe prices list --limit 10

# Check environment variables
echo $NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY
```

**Problem**: Webhooks not received
```bash
# Solution: Test webhook connectivity
stripe webhooks test --endpoint YOUR_WEBHOOK_URL
```

### Usage Tracking Issues

**Problem**: Usage not resetting at billing period
```sql
-- Check current usage records
SELECT * FROM usage_tracking ORDER BY created_at DESC LIMIT 5;

-- Manually create new period (for testing)
INSERT INTO usage_tracking (user_id, billing_period_start, billing_period_end, stories_generated, premium_voices_used)
VALUES ('user-id', '2025-12-01', '2025-12-31', 0, 0);
```

---

## Monitoring & Alerts

### Set Up Monitoring

1. **Sentry** (errors)
   ```bash
   npm install @sentry/nextjs
   # Configure in sentry.client.config.js
   ```

2. **Vercel Analytics** (performance)
   - Already enabled in Vercel dashboard

3. **Stripe Dashboard** (payments)
   - Monitor failed payments
   - Track conversion rates
   - Review churn

### Key Metrics to Track

- Daily Active Users by tier
- Conversion rate (free → paid)
- Upgrade rate (tier → tier)
- Churn rate
- Average revenue per user (ARPU)
- Customer lifetime value (CLV)
- Story generation by tier
- Premium voice usage

---

## Next Steps

After completing this setup:

1. **Build Pricing Page UI** (Phase 2)
   - Display tier options
   - Show current usage
   - Upgrade/downgrade flows

2. **ElevenLabs Integration** (Phase 5)
   - Premium voice selection
   - Voice cloning features
   - Character voices

3. **Gift Subscriptions** (Phase 6)
   - Gift card system
   - Redemption flow
   - Expiration handling

---

## Support

If you encounter issues:

1. Check the [Implementation Status](./IMPLEMENTATION_STATUS.md)
2. Review [Monetization Plan](./MONETIZATION_IMPLEMENTATION_PLAN.md)
3. Check Supabase logs
4. Check Vercel deployment logs
5. Check Stripe dashboard events

---

**Setup Complete!** 🎉

Your multi-tier subscription system is now ready for testing and deployment.
