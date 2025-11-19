# 🎯 Amari Monetization Implementation Plan - TDD Approach

**Version**: 1.0
**Last Updated**: 2025-11-18
**Status**: Planning Complete, Ready for Implementation

---

## 📋 Executive Summary

This document outlines a **6-phase, TDD-driven implementation plan** for Amari's multi-tier subscription system with:
- 4 subscription tiers (Free, Dream Weaver, Magic Circle, Enchanted Library)
- Usage tracking and enforcement
- ElevenLabs premium voice integration
- Gift subscription system
- 50%+ profit margins on all paid tiers

**Total Estimated Duration**: 21-27 days

---

## 💰 Final Pricing Structure (Locked)

### Subscription Tiers

| Tier | Monthly | Annual | Stories/Mo | Premium Voice | Margin |
|------|---------|--------|------------|---------------|--------|
| **Free** | $0 | - | 3 | 0 | -$0.45 (CAC) |
| **Dream Weaver** | $6.99 | $59.99 ($4.99/mo) | 10 | 3 | 70% / 58% |
| **Magic Circle** | $14.99 | $119.99 ($9.99/mo) | 30 | 15 | 50% / 25% |
| **Enchanted Library** | $29.99 | $249.99 ($20.83/mo) | 60 (capped) | 60 | 30% / ~0% |

### Gift Subscription Pricing

| Gift Package | Tier | Duration | Price | Margin |
|--------------|------|----------|-------|--------|
| Starter Magic | Dream Weaver | 3 months | $24.99 | 75% |
| Holiday Bundle | Dream Weaver | 6 months | $44.99 | 72% |
| Year of Dreams | Dream Weaver | 12 months | $79.99 | 68% |
| Premium Gift | Magic Circle | 3 months | $49.99 | 55% |
| Magic Half-Year | Magic Circle | 6 months | $89.99 | 50% |
| Annual Magic | Magic Circle | 12 months | $179.99 | 50% |
| Ultimate Library | Enchanted Library | 12 months | $219.99 | 52% |

---

## 📊 Phase Overview

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| **Phase 1** | Database Schema & Migrations | 2-3 days | None |
| **Phase 2** | Stripe Products & Subscription Logic | 3-4 days | Phase 1 |
| **Phase 3** | Usage Tracking & Enforcement | 4-5 days | Phase 1, 2 |
| **Phase 4** | Tier UI & Upgrade Flows | 3-4 days | Phase 2, 3 |
| **Phase 5** | ElevenLabs Voice Integration | 5-6 days | Phase 3, 4 |
| **Phase 6** | Gift Subscriptions | 4-5 days | Phase 2, 4 |

---

## 🔧 PHASE 1: Database Schema & Migrations (TDD)

### **Goal**: Extend existing schema without breaking current functionality

### **Current State Analysis**:
- ✅ Users table has: `subscription_status` (enum: 'free', 'premium', 'trial')
- ✅ Users table has: `stripe_customer_id`, `subscription_end_date`
- ✅ Stripe webhook handles: checkout, subscription updates, deletions
- ⚠️ **Missing**: Granular tier support, usage tracking, gift subscriptions

### **Test Specifications**:

#### Test 1.1: Schema Migration - Non-Breaking
```typescript
describe('Database Migration', () => {
  it('should add new columns without dropping existing data', async () => {
    // Arrange: Create test user with existing subscription_status
    const testUser = await createTestUser({ subscription_status: 'premium' })

    // Act: Run migration
    await runMigration('001_add_tier_system.sql')

    // Assert: Old data persists
    const user = await getUserById(testUser.id)
    expect(user.subscription_status).toBe('premium')
    expect(user.subscription_tier).toBe('magic_circle') // Default mapping
  })
})
```

#### Test 1.2: Tier Limits Configuration
```typescript
describe('Tier Limits', () => {
  it('should retrieve correct limits for each tier', async () => {
    const freeLimits = await getTierLimits('free')
    expect(freeLimits).toEqual({
      monthly_stories: 3,
      monthly_premium_voices: 0,
      max_children: 2,
      max_saved_stories: 5
    })

    const dreamWeaverLimits = await getTierLimits('dream_weaver')
    expect(dreamWeaverLimits.monthly_stories).toBe(10)
    expect(dreamWeaverLimits.monthly_premium_voices).toBe(3)
  })
})
```

#### Test 1.3: Usage Tracking Table
```typescript
describe('Usage Tracking', () => {
  it('should track story generation per billing period', async () => {
    const user = await createTestUser()

    // Act: Generate stories
    await trackStoryGeneration(user.id, { usedPremiumVoice: true })
    await trackStoryGeneration(user.id, { usedPremiumVoice: false })

    // Assert: Usage recorded
    const usage = await getCurrentUsage(user.id)
    expect(usage.stories_generated).toBe(2)
    expect(usage.premium_voices_used).toBe(1)
  })

  it('should reset usage on new billing period', async () => {
    const user = await createTestUser()
    await trackStoryGeneration(user.id)

    // Simulate billing period rollover
    await advanceBillingPeriod(user.id)

    const usage = await getCurrentUsage(user.id)
    expect(usage.stories_generated).toBe(0)
  })
})
```

### **Implementation Files**:

#### File: `supabase/migrations/001_add_tier_system.sql`
```sql
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
```

#### File: `tests/database/tier-system.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase/server'

describe('Tier System Migration', () => {
  let testUserId: string

  beforeEach(async () => {
    // Create test user
    const { data } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`
      })
      .select()
      .single()

    testUserId = data!.id
  })

  afterEach(async () => {
    // Cleanup
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', testUserId)
  })

  it('should have default free tier for new users', async () => {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('subscription_tier')
      .eq('id', testUserId)
      .single()

    expect(user?.subscription_tier).toBe('free')
  })

  it('should retrieve tier limits correctly', async () => {
    const { data: limits } = await supabaseAdmin
      .from('tier_limits')
      .select('*')
      .eq('tier_name', 'dream_weaver')
      .single()

    expect(limits).toMatchObject({
      monthly_stories: 10,
      monthly_premium_voices: 3,
      max_children: 3
    })
  })

  it('should track usage per billing period', async () => {
    const periodStart = new Date()
    periodStart.setDate(1) // First of month
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .insert({
        user_id: testUserId,
        billing_period_start: periodStart.toISOString().split('T')[0],
        billing_period_end: periodEnd.toISOString().split('T')[0],
        stories_generated: 2,
        premium_voices_used: 1
      })
      .select()
      .single()

    expect(usage?.stories_generated).toBe(2)
    expect(usage?.premium_voices_used).toBe(1)
  })
})
```

### **Rollback Procedure**:
```sql
-- To rollback Phase 1 migration
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS tier_limits CASCADE;
ALTER TABLE stories DROP COLUMN IF EXISTS voice_provider;
ALTER TABLE stories DROP COLUMN IF EXISTS voice_config;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_period_start;
ALTER TABLE users DROP COLUMN IF EXISTS current_period_end;
DROP TYPE IF EXISTS subscription_tier;
```

---

## 🔧 PHASE 2: Stripe Products & Subscription Management (TDD)

### **Goal**: Create Stripe products and update webhook to handle multi-tier subscriptions

### **Test Specifications**:

#### Test 2.1: Stripe Product Creation
```typescript
describe('Stripe Products', () => {
  it('should create all tier products in Stripe', async () => {
    const products = await createStripeProducts()

    expect(products).toHaveLength(3) // 3 paid tiers
    expect(products.find(p => p.name === 'Dream Weaver')).toBeDefined()
    expect(products.find(p => p.name === 'Magic Circle')).toBeDefined()
    expect(products.find(p => p.name === 'Enchanted Library')).toBeDefined()
  })

  it('should create monthly and annual prices for each product', async () => {
    const dreamWeaverPrices = await getProductPrices('dream_weaver')

    const monthly = dreamWeaverPrices.find(p => p.recurring.interval === 'month')
    const annual = dreamWeaverPrices.find(p => p.recurring.interval === 'year')

    expect(monthly?.unit_amount).toBe(699) // $6.99
    expect(annual?.unit_amount).toBe(5999) // $59.99
  })
})
```

#### Test 2.2: Webhook Tier Mapping
```typescript
describe('Stripe Webhook - Tier Mapping', () => {
  it('should map Stripe price ID to correct tier', async () => {
    const priceId = 'price_dreamweaver_monthly'
    const tier = await mapPriceIdToTier(priceId)

    expect(tier).toBe('dream_weaver')
  })

  it('should update user tier on checkout.session.completed', async () => {
    const mockEvent = createMockCheckoutEvent({
      priceId: 'price_magicCircle_annual',
      customerId: 'cus_123',
      clerkUserId: 'user_123'
    })

    await handleStripeWebhook(mockEvent)

    const user = await getUserByClerkId('user_123')
    expect(user.subscription_tier).toBe('magic_circle')
    expect(user.subscription_period_start).toBeDefined()
  })

  it('should initialize usage tracking on subscription start', async () => {
    const mockEvent = createMockCheckoutEvent({
      priceId: 'price_dreamweaver_monthly',
      clerkUserId: 'user_123'
    })

    await handleStripeWebhook(mockEvent)

    const usage = await getCurrentUsage('user_123')
    expect(usage).toBeDefined()
    expect(usage.stories_generated).toBe(0)
  })
})
```

#### Test 2.3: Subscription Updates
```typescript
describe('Subscription Updates', () => {
  it('should handle tier upgrade correctly', async () => {
    // User starts with dream_weaver
    const user = await createUserWithTier('dream_weaver')

    // Upgrade to magic_circle
    const mockEvent = createMockSubscriptionUpdatedEvent({
      customerId: user.stripe_customer_id,
      newPriceId: 'price_magicCircle_monthly'
    })

    await handleStripeWebhook(mockEvent)

    const updated = await getUserById(user.id)
    expect(updated.subscription_tier).toBe('magic_circle')

    // Usage should reset on upgrade
    const usage = await getCurrentUsage(user.id)
    expect(usage.billing_period_start).toEqual(expect.any(Date))
  })

  it('should handle tier downgrade at period end', async () => {
    const user = await createUserWithTier('magic_circle')

    const mockEvent = createMockSubscriptionUpdatedEvent({
      customerId: user.stripe_customer_id,
      newPriceId: 'price_dreamweaver_monthly',
      cancel_at_period_end: true
    })

    await handleStripeWebhook(mockEvent)

    // Tier should remain until period ends
    const stillActive = await getUserById(user.id)
    expect(stillActive.subscription_tier).toBe('magic_circle')
  })
})
```

### **Implementation Files**:

See implementation details in codebase files section below.

---

## 🔧 PHASE 3: Usage Tracking & Enforcement (TDD)

### **Goal**: Implement usage limits and enforcement for each tier

### **Test Specifications**:

#### Test 3.1: Story Generation Limits
```typescript
describe('Story Generation Limits', () => {
  it('should allow story generation within tier limits', async () => {
    const user = await createUserWithTier('free') // 3 stories/month

    // Generate 3 stories - should succeed
    for (let i = 0; i < 3; i++) {
      const result = await canGenerateStory(user.id)
      expect(result.allowed).toBe(true)
      await incrementStoryUsage(user.id)
    }

    // 4th story - should fail
    const result = await canGenerateStory(user.id)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('limit reached')
  })

  it('should suggest upgrade when limit reached', async () => {
    const user = await createUserWithTier('free')

    // Max out stories
    for (let i = 0; i < 3; i++) {
      await incrementStoryUsage(user.id)
    }

    const result = await canGenerateStory(user.id)
    expect(result.upgradePrompt).toBeDefined()
    expect(result.suggestedTier).toBe('dream_weaver')
  })

  it('should allow unlimited stories for enchanted_library tier', async () => {
    const user = await createUserWithTier('enchanted_library')

    // Generate 100 stories - should all succeed (up to cap of 60)
    for (let i = 0; i < 60; i++) {
      const result = await canGenerateStory(user.id)
      expect(result.allowed).toBe(true)
      await incrementStoryUsage(user.id)
    }

    // 61st should fail (cap reached)
    const result = await canGenerateStory(user.id)
    expect(result.allowed).toBe(false)
  })
})
```

#### Test 3.2: Premium Voice Limits
```typescript
describe('Premium Voice Limits', () => {
  it('should enforce premium voice quota per tier', async () => {
    const user = await createUserWithTier('dream_weaver') // 3 premium voices/month

    // Use 3 premium voices
    for (let i = 0; i < 3; i++) {
      const result = await canUsePremiumVoice(user.id)
      expect(result.allowed).toBe(true)
      await incrementStoryUsage(user.id, true)
    }

    // 4th premium voice should fail
    const result = await canUsePremiumVoice(user.id)
    expect(result.allowed).toBe(false)
    expect(result.fallbackToWeb).toBe(true)
  })

  it('should allow web voice after premium quota exhausted', async () => {
    const user = await createUserWithTier('dream_weaver')

    // Max out premium voices
    for (let i = 0; i < 3; i++) {
      await incrementStoryUsage(user.id, true)
    }

    // Should still allow story with web voice
    const storyResult = await canGenerateStory(user.id)
    expect(storyResult.allowed).toBe(true)

    const voiceResult = await canUsePremiumVoice(user.id)
    expect(voiceResult.allowed).toBe(false)
    expect(voiceResult.useWebVoice).toBe(true)
  })
})
```

#### Test 3.3: Billing Period Reset
```typescript
describe('Billing Period Reset', () => {
  it('should reset usage on subscription renewal', async () => {
    const user = await createUserWithTier('dream_weaver')

    // Max out current period
    for (let i = 0; i < 10; i++) {
      await incrementStoryUsage(user.id)
    }

    let usage = await getCurrentUsage(user.id)
    expect(usage.stories_generated).toBe(10)

    // Simulate renewal webhook
    await handleSubscriptionRenewal(user.stripe_subscription_id)

    // Usage should reset
    usage = await getCurrentUsage(user.id)
    expect(usage.stories_generated).toBe(0)
  })
})
```

### **Implementation Files**:

#### File: `lib/subscription/limits.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase/server'
import { getCurrentUsage } from './usage'

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  upgradePrompt?: string
  suggestedTier?: string
  currentUsage?: number
  limit?: number
  fallbackToWeb?: boolean
  useWebVoice?: boolean
}

export async function getTierLimits(tier: string) {
  const { data } = await supabaseAdmin
    .from('tier_limits')
    .select('*')
    .eq('tier_name', tier)
    .single()

  return data
}

export async function canGenerateStory(userId: string): Promise<LimitCheckResult> {
  // Get user's tier
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (!user) {
    return { allowed: false, reason: 'User not found' }
  }

  // Get tier limits
  const limits = await getTierLimits(user.subscription_tier)
  if (!limits) {
    return { allowed: false, reason: 'Invalid tier' }
  }

  // Get current usage
  const usage = await getCurrentUsage(userId)

  // Check if within limits
  if (usage.stories_generated >= limits.monthly_stories) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limits.monthly_stories} stories`,
      upgradePrompt: `Upgrade to ${getNextTier(user.subscription_tier)} for more stories!`,
      suggestedTier: getNextTier(user.subscription_tier),
      currentUsage: usage.stories_generated,
      limit: limits.monthly_stories
    }
  }

  return {
    allowed: true,
    currentUsage: usage.stories_generated,
    limit: limits.monthly_stories
  }
}

export async function canUsePremiumVoice(userId: string): Promise<LimitCheckResult> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (!user) {
    return { allowed: false, reason: 'User not found' }
  }

  const limits = await getTierLimits(user.subscription_tier)
  if (!limits) {
    return { allowed: false, reason: 'Invalid tier' }
  }

  // Free tier has no premium voices
  if (limits.monthly_premium_voices === 0) {
    return {
      allowed: false,
      reason: 'Premium voices not available on free tier',
      upgradePrompt: 'Upgrade to Dream Weaver for premium voices!',
      useWebVoice: true,
      fallbackToWeb: true
    }
  }

  const usage = await getCurrentUsage(userId)

  if (usage.premium_voices_used >= limits.monthly_premium_voices) {
    return {
      allowed: false,
      reason: `You've used all ${limits.monthly_premium_voices} premium voices this month`,
      upgradePrompt: user.subscription_tier !== 'enchanted_library'
        ? 'Upgrade for more premium voices!'
        : 'More premium voices next billing period',
      useWebVoice: true,
      fallbackToWeb: true,
      currentUsage: usage.premium_voices_used,
      limit: limits.monthly_premium_voices
    }
  }

  return {
    allowed: true,
    currentUsage: usage.premium_voices_used,
    limit: limits.monthly_premium_voices
  }
}

function getNextTier(currentTier: string): string {
  const tierHierarchy = ['free', 'dream_weaver', 'magic_circle', 'enchanted_library']
  const currentIndex = tierHierarchy.indexOf(currentTier)

  if (currentIndex < tierHierarchy.length - 1) {
    return tierHierarchy[currentIndex + 1]
  }

  return currentTier
}
```

#### File: `app/api/generate-story/route.ts` (Updated)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { canGenerateStory, canUsePremiumVoice } from '@/lib/subscription/limits'
import { incrementStoryUsage } from '@/lib/subscription/usage'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user can generate a story
    const storyCheck = await canGenerateStory(user.id)
    if (!storyCheck.allowed) {
      return NextResponse.json({
        error: 'Story limit reached',
        message: storyCheck.reason,
        upgradePrompt: storyCheck.upgradePrompt,
        suggestedTier: storyCheck.suggestedTier,
        currentUsage: storyCheck.currentUsage,
        limit: storyCheck.limit
      }, { status: 403 })
    }

    const body = await req.json()
    const { children, config, usePremiumVoice } = body

    // Check premium voice availability
    let shouldUsePremiumVoice = false
    if (usePremiumVoice) {
      const voiceCheck = await canUsePremiumVoice(user.id)
      shouldUsePremiumVoice = voiceCheck.allowed

      if (!voiceCheck.allowed && !voiceCheck.fallbackToWeb) {
        return NextResponse.json({
          error: 'Premium voice unavailable',
          message: voiceCheck.reason,
          upgradePrompt: voiceCheck.upgradePrompt
        }, { status: 403 })
      }
    }

    // Generate story (existing OpenAI logic)
    const story = await generateStoryWithOpenAI(children, config)

    // Save to database
    const { data: savedStory } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: user.id,
        title: story.title,
        content: story.content,
        tone: config.tone,
        length: config.length,
        word_count: story.wordCount,
        voice_provider: shouldUsePremiumVoice ? 'elevenlabs' : 'web'
      })
      .select()
      .single()

    // Increment usage
    await incrementStoryUsage(user.id, shouldUsePremiumVoice)

    return NextResponse.json({
      story: savedStory,
      usedPremiumVoice: shouldUsePremiumVoice,
      remainingStories: storyCheck.limit - storyCheck.currentUsage - 1,
      remainingPremiumVoices: shouldUsePremiumVoice
        ? (await canUsePremiumVoice(user.id)).limit! - (await canUsePremiumVoice(user.id)).currentUsage! - 1
        : 0
    })

  } catch (error) {
    console.error('Error generating story:', error)
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    )
  }
}

// Existing generateStoryWithOpenAI function...
```

#### File: `tests/integration/usage-limits.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { canGenerateStory, canUsePremiumVoice } from '@/lib/subscription/limits'
import { incrementStoryUsage } from '@/lib/subscription/usage'
import { supabaseAdmin } from '@/lib/supabase/server'

describe('Usage Limits Enforcement', () => {
  let freeUserId: string
  let dreamWeaverUserId: string

  beforeEach(async () => {
    // Create free tier user
    const { data: freeUser } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: `free_${Date.now()}`,
        email: `free_${Date.now()}@test.com`,
        subscription_tier: 'free'
      })
      .select()
      .single()

    freeUserId = freeUser!.id

    // Create dream weaver user
    const { data: paidUser } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: `paid_${Date.now()}`,
        email: `paid_${Date.now()}@test.com`,
        subscription_tier: 'dream_weaver'
      })
      .select()
      .single()

    dreamWeaverUserId = paidUser!.id
  })

  it('should block story generation after free tier limit', async () => {
    // Generate 3 stories
    for (let i = 0; i < 3; i++) {
      await incrementStoryUsage(freeUserId)
    }

    const result = await canGenerateStory(freeUserId)
    expect(result.allowed).toBe(false)
    expect(result.suggestedTier).toBe('dream_weaver')
  })

  it('should allow premium voices within quota', async () => {
    const result = await canUsePremiumVoice(dreamWeaverUserId)
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(3)
  })

  it('should fallback to web voice after premium quota', async () => {
    // Use all 3 premium voices
    for (let i = 0; i < 3; i++) {
      await incrementStoryUsage(dreamWeaverUserId, true)
    }

    const result = await canUsePremiumVoice(dreamWeaverUserId)
    expect(result.allowed).toBe(false)
    expect(result.fallbackToWeb).toBe(true)
  })
})
```

---

## 🔧 PHASE 4: Tier UI & Upgrade Flows (TDD)

### **Goal**: Build user-facing pricing page and upgrade flows

### **Test Specifications**:

#### Test 4.1: Pricing Page Display
```typescript
describe('Pricing Page', () => {
  it('should display all tiers with correct pricing', async () => {
    render(<PricingPage />)

    expect(screen.getByText('$6.99')).toBeInTheDocument()
    expect(screen.getByText('$14.99')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()

    // Annual pricing
    expect(screen.getByText('$59.99')).toBeInTheDocument()
    expect(screen.getByText('$119.99')).toBeInTheDocument()
    expect(screen.getByText('$249.99')).toBeInTheDocument()
  })

  it('should highlight current tier', async () => {
    const user = createMockUser({ tier: 'magic_circle' })
    render(<PricingPage user={user} />)

    const magicCircleCard = screen.getByTestId('tier-magic_circle')
    expect(magicCircleCard).toHaveClass('current-tier')
  })

  it('should show upgrade button for lower tiers', async () => {
    const user = createMockUser({ tier: 'dream_weaver' })
    render(<PricingPage user={user} />)

    const magicCircleCard = screen.getByTestId('tier-magic_circle')
    expect(within(magicCircleCard).getByText('Upgrade')).toBeInTheDocument()

    const dreamWeaverCard = screen.getByTestId('tier-dream_weaver')
    expect(within(dreamWeaverCard).getByText('Current Plan')).toBeInTheDocument()
  })
})
```

#### Test 4.2: Checkout Flow
```typescript
describe('Checkout Flow', () => {
  it('should create checkout session for selected tier', async () => {
    const user = createMockUser({ tier: 'free' })
    const createCheckoutSession = vi.fn().mockResolvedValue({
      url: 'https://checkout.stripe.com/...'
    })

    render(<PricingPage user={user} />)

    const upgradeButton = screen.getByTestId('upgrade-dream_weaver')
    await userEvent.click(upgradeButton)

    expect(createCheckoutSession).toHaveBeenCalledWith({
      tier: 'dream_weaver',
      interval: 'month'
    })
  })

  it('should allow switching between monthly and annual', async () => {
    render(<PricingPage />)

    const annualToggle = screen.getByLabelText('Annual')
    await userEvent.click(annualToggle)

    expect(screen.getByText('$59.99/year')).toBeInTheDocument()
    expect(screen.getByText('Save 29%')).toBeInTheDocument()
  })
})
```

#### Test 4.3: Limit Reached Prompts
```typescript
describe('Limit Reached Prompts', () => {
  it('should show upgrade modal when story limit reached', async () => {
    const user = createMockUser({
      tier: 'free',
      usage: { stories_generated: 3, premium_voices_used: 0 }
    })

    render(<StoryWizard user={user} />)

    const generateButton = screen.getByText('Generate Story')
    await userEvent.click(generateButton)

    expect(screen.getByText(/limit reached/i)).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Dream Weaver')).toBeInTheDocument()
  })

  it('should show premium voice quota in UI', async () => {
    const user = createMockUser({
      tier: 'dream_weaver',
      usage: { stories_generated: 2, premium_voices_used: 1 }
    })

    render(<Dashboard user={user} />)

    expect(screen.getByText('2 of 3 premium voices used')).toBeInTheDocument()
  })
})
```

### **Implementation Files**:

#### File: `app/(app)/pricing/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Check, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

const tiers = [
  {
    id: 'dream_weaver',
    name: 'Dream Weaver',
    description: 'Perfect for weekly bedtime stories',
    monthlyPrice: 6.99,
    annualPrice: 59.99,
    features: [
      '10 stories per month',
      '3 premium voice stories',
      'Up to 3 children',
      'Unlimited saves',
      'Download as text',
      'Basic story themes'
    ]
  },
  {
    id: 'magic_circle',
    name: 'Magic Circle',
    description: 'For daily bedtime routines',
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    popular: true,
    features: [
      '30 stories per month',
      '15 premium voice stories',
      'Up to 5 children',
      'Family sharing (2 accounts)',
      'PDF & MP3 downloads',
      'Premium themes',
      'Scheduled delivery',
      'Reading insights'
    ]
  },
  {
    id: 'enchanted_library',
    name: 'Enchanted Library',
    description: 'Unlimited magic for your family',
    monthlyPrice: 29.99,
    annualPrice: 249.99,
    features: [
      '60 stories per month',
      'Unlimited premium voices',
      'Unlimited children',
      'Family sharing (4 accounts)',
      'Character-specific voices',
      'Custom story themes',
      'Priority support',
      'Early access features',
      '1 gift subscription/year'
    ]
  }
]

export default function PricingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (tierId: string) => {
    setLoading(tierId)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          interval: isAnnual ? 'year' : 'month'
        })
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Magic</h1>
        <p className="text-xl text-gray-600 mb-8">
          Select the perfect plan for your family's bedtime stories
        </p>

        {/* Annual toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={!isAnnual ? 'font-semibold' : ''}>Monthly</span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <span className={isAnnual ? 'font-semibold' : ''}>
            Annual <span className="text-green-600">(Save up to 33%)</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => {
          const price = isAnnual ? tier.annualPrice : tier.monthlyPrice
          const savings = isAnnual
            ? Math.round((1 - (tier.annualPrice / 12) / tier.monthlyPrice) * 100)
            : 0

          return (
            <Card
              key={tier.id}
              data-testid={`tier-${tier.id}`}
              className={tier.popular ? 'border-2 border-lavender-500 shadow-xl' : ''}
            >
              {tier.popular && (
                <div className="bg-lavender-500 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>

                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${isAnnual ? (tier.annualPrice / 12).toFixed(2) : price}
                  </span>
                  <span className="text-gray-600">/month</span>

                  {isAnnual && (
                    <div className="text-sm text-green-600 mt-2">
                      Save {savings}% • ${tier.annualPrice}/year
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  data-testid={`upgrade-${tier.id}`}
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={loading === tier.id}
                  className="w-full"
                  size="lg"
                >
                  {loading === tier.id ? (
                    'Loading...'
                  ) : (
                    <>
                      Get Started <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Free tier info */}
      <Card className="max-w-2xl mx-auto mt-12 bg-gray-50">
        <CardHeader>
          <CardTitle>Free - Storyteller</CardTitle>
          <CardDescription>Try Amari with our free tier</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              3 stories per month
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Web voice narration
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Up to 2 children
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### File: `components/upgrade-prompt.tsx`
```typescript
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  suggestedTier?: string
  currentUsage?: number
  limit?: number
}

export function UpgradePrompt({
  open,
  onOpenChange,
  message,
  suggestedTier,
  currentUsage,
  limit
}: UpgradePromptProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>✨ Unlock More Magic</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>

        {currentUsage !== undefined && limit !== undefined && (
          <div className="bg-lavender-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-2">Monthly Usage</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-lavender-500 h-2 rounded-full"
                style={{ width: `${(currentUsage / limit) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentUsage} of {limit} used
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push('/pricing')
            }}
            className="flex-1"
          >
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔧 PHASE 5: ElevenLabs Voice Integration (TDD)

### **Goal**: Integrate ElevenLabs premium voices with tier-based allocation

### **Test Specifications**:

#### Test 5.1: ElevenLabs API Integration
```typescript
describe('ElevenLabs Integration', () => {
  it('should generate audio with ElevenLabs API', async () => {
    const text = "Once upon a time, in a magical forest..."
    const voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel voice

    const audio = await generateElevenLabsAudio(text, voiceId)

    expect(audio).toBeDefined()
    expect(audio.audioBuffer).toBeInstanceOf(Buffer)
    expect(audio.contentType).toBe('audio/mpeg')
  })

  it('should handle API errors gracefully', async () => {
    const invalidVoiceId = 'invalid_voice_id'

    await expect(
      generateElevenLabsAudio("Test", invalidVoiceId)
    ).rejects.toThrow('ElevenLabs API error')
  })

  it('should respect character limits', async () => {
    const longText = 'a'.repeat(10000) // Very long text

    await expect(
      generateElevenLabsAudio(longText, 'voice_id')
    ).rejects.toThrow('Text exceeds character limit')
  })
})
```

#### Test 5.2: Audio Caching
```typescript
describe('Audio Caching', () => {
  it('should cache generated audio in Supabase Storage', async () => {
    const storyId = 'story_123'
    const audioBuffer = Buffer.from('fake audio data')

    const url = await cacheStoryAudio(storyId, audioBuffer)

    expect(url).toMatch(/supabase.*storage/)
    expect(url).toContain(storyId)
  })

  it('should return cached audio if exists', async () => {
    const storyId = 'story_123'
    const existingUrl = 'https://storage.example.com/audio/story_123.mp3'

    // Mock existing audio
    await supabaseAdmin
      .from('stories')
      .update({ audio_url: existingUrl })
      .eq('id', storyId)

    const result = await getOrGenerateAudio(storyId)

    expect(result.cached).toBe(true)
    expect(result.url).toBe(existingUrl)
  })

  it('should generate new audio if cache miss', async () => {
    const storyId = 'new_story'

    const result = await getOrGenerateAudio(storyId)

    expect(result.cached).toBe(false)
    expect(result.url).toBeDefined()
  })
})
```

#### Test 5.3: Voice Selection
```typescript
describe('Voice Selection', () => {
  it('should list available ElevenLabs voices', async () => {
    const voices = await getAvailableVoices()

    expect(voices).toBeInstanceOf(Array)
    expect(voices.length).toBeGreaterThan(0)
    expect(voices[0]).toHaveProperty('voice_id')
    expect(voices[0]).toHaveProperty('name')
  })

  it('should allow character-specific voices for enchanted_library tier', async () => {
    const user = await createUserWithTier('enchanted_library')

    const config = {
      characters: [
        { name: 'Emma', voiceId: 'voice_1' },
        { name: 'Liam', voiceId: 'voice_2' }
      ]
    }

    const canUse = await canUseCharacterVoices(user.id)
    expect(canUse.allowed).toBe(true)
  })

  it('should block character voices for lower tiers', async () => {
    const user = await createUserWithTier('magic_circle')

    const canUse = await canUseCharacterVoices(user.id)
    expect(canUse.allowed).toBe(false)
    expect(canUse.upgradePrompt).toContain('Enchanted Library')
  })
})
```

#### Test 5.4: Audio Generation in Story Flow
```typescript
describe('Story Generation with Audio', () => {
  it('should generate story with premium voice', async () => {
    const user = await createUserWithTier('dream_weaver')

    const result = await generateStory({
      userId: user.id,
      usePremiumVoice: true,
      children: [{ name: 'Alice', items: ['dragon', 'castle'] }],
      config: { tone: 'bedtime-calm', length: 'medium' }
    })

    expect(result.story.voice_provider).toBe('elevenlabs')
    expect(result.story.audio_url).toBeDefined()
    expect(result.story.audio_url).toMatch(/\.mp3$/)
  })

  it('should fallback to web voice when quota exceeded', async () => {
    const user = await createUserWithTier('dream_weaver')

    // Use all 3 premium voices
    for (let i = 0; i < 3; i++) {
      await incrementStoryUsage(user.id, true)
    }

    const result = await generateStory({
      userId: user.id,
      usePremiumVoice: true,
      children: [{ name: 'Bob', items: ['spaceship'] }],
      config: { tone: 'adventure', length: 'quick' }
    })

    expect(result.story.voice_provider).toBe('web')
    expect(result.fallbackReason).toBe('Premium voice quota exceeded')
  })
})
```

### **Implementation Files**:

#### File: `lib/elevenlabs/client.ts`
```typescript
import { createClient } from 'elevenlabs'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!

export const elevenLabsClient = createClient({
  apiKey: ELEVENLABS_API_KEY
})

export interface Voice {
  voice_id: string
  name: string
  preview_url: string
  category: string
  labels: Record<string, string>
}

export async function getAvailableVoices(): Promise<Voice[]> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch voices')
    }

    const data = await response.json()
    return data.voices
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error)
    throw error
  }
}

export async function generateElevenLabsAudio(
  text: string,
  voiceId: string,
  options?: {
    stability?: number
    similarity_boost?: number
  }
): Promise<{ audioBuffer: Buffer; contentType: string }> {
  if (!text || text.length === 0) {
    throw new Error('Text cannot be empty')
  }

  if (text.length > 5000) {
    throw new Error('Text exceeds character limit of 5000')
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: options?.stability || 0.5,
            similarity_boost: options?.similarity_boost || 0.75
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs API error:', error)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    return {
      audioBuffer,
      contentType: 'audio/mpeg'
    }
  } catch (error) {
    console.error('Error generating ElevenLabs audio:', error)
    throw error
  }
}

export const DEFAULT_VOICES = {
  narrator: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm female voice
  child_female: 'EXAVITQu4vr4xnSDxMaL', // Bella - young female
  child_male: 'ErXwobaYiN019PkySvjV', // Antoni - young male
  storyteller: 'pNInz6obpgDQGcFmaJgB' // Adam - storyteller voice
}
```

#### File: `lib/elevenlabs/audio-storage.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'story-audio'

export async function cacheStoryAudio(
  storyId: string,
  audioBuffer: Buffer,
  metadata?: { voice_id: string; voice_name: string }
): Promise<string> {
  try {
    const fileName = `${storyId}.mp3`
    const filePath = `stories/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading audio:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    // Update story with audio URL
    await supabaseAdmin
      .from('stories')
      .update({
        audio_url: urlData.publicUrl,
        voice_config: metadata ? JSON.stringify(metadata) : null
      })
      .eq('id', storyId)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error caching story audio:', error)
    throw error
  }
}

export async function getOrGenerateAudio(
  storyId: string
): Promise<{ url: string; cached: boolean }> {
  // Check if audio already exists
  const { data: story } = await supabaseAdmin
    .from('stories')
    .select('audio_url, content, voice_provider')
    .eq('id', storyId)
    .single()

  if (!story) {
    throw new Error('Story not found')
  }

  // Return cached if exists
  if (story.audio_url && story.voice_provider === 'elevenlabs') {
    return { url: story.audio_url, cached: true }
  }

  // Generate new audio
  const { audioBuffer } = await generateElevenLabsAudio(
    story.content,
    DEFAULT_VOICES.narrator
  )

  const url = await cacheStoryAudio(storyId, audioBuffer, {
    voice_id: DEFAULT_VOICES.narrator,
    voice_name: 'Rachel'
  })

  return { url, cached: false }
}

export async function deleteStoryAudio(storyId: string): Promise<void> {
  const filePath = `stories/${storyId}.mp3`

  const { error } = await supabaseAdmin
    .storage
    .from(STORAGE_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Error deleting audio:', error)
    throw error
  }
}
```

#### File: `lib/subscription/voice-features.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase/server'
import { getTierLimits } from './limits'

export async function canUseCharacterVoices(userId: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (!user) {
    return { allowed: false, reason: 'User not found' }
  }

  const limits = await getTierLimits(user.subscription_tier)
  const hasFeature = limits?.features?.character_voices === true

  if (!hasFeature) {
    return {
      allowed: false,
      reason: 'Character-specific voices not available on your tier',
      upgradePrompt: 'Upgrade to Enchanted Library for character voices!',
      requiredTier: 'enchanted_library'
    }
  }

  return { allowed: true }
}

export async function canDownloadAudio(userId: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single()

  if (!user) {
    return { allowed: false }
  }

  const limits = await getTierLimits(user.subscription_tier)
  const hasMp3Download = limits?.features?.mp3_download === true

  return {
    allowed: hasMp3Download,
    reason: hasMp3Download ? undefined : 'MP3 downloads not available on your tier'
  }
}
```

#### File: `app/api/generate-audio/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { canUsePremiumVoice } from '@/lib/subscription/limits'
import { generateElevenLabsAudio, DEFAULT_VOICES } from '@/lib/elevenlabs/client'
import { cacheStoryAudio } from '@/lib/elevenlabs/audio-storage'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { storyId, voiceId } = body

    // Get story
    const { data: story } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Check if already has audio
    if (story.audio_url) {
      return NextResponse.json({
        audioUrl: story.audio_url,
        cached: true
      })
    }

    // Check premium voice quota
    const voiceCheck = await canUsePremiumVoice(user.id)
    if (!voiceCheck.allowed) {
      return NextResponse.json({
        error: 'Premium voice quota exceeded',
        message: voiceCheck.reason,
        fallbackToWeb: true
      }, { status: 403 })
    }

    // Generate audio
    const selectedVoice = voiceId || DEFAULT_VOICES.narrator
    const { audioBuffer } = await generateElevenLabsAudio(
      story.content,
      selectedVoice
    )

    // Cache audio
    const audioUrl = await cacheStoryAudio(storyId, audioBuffer, {
      voice_id: selectedVoice,
      voice_name: 'Custom'
    })

    return NextResponse.json({
      audioUrl,
      cached: false,
      voiceProvider: 'elevenlabs'
    })

  } catch (error) {
    console.error('Error generating audio:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
}
```

#### File: `components/voice-selector.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Volume2, Play, Pause } from 'lucide-react'

interface Voice {
  voice_id: string
  name: string
  preview_url: string
  category: string
}

interface VoiceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (voiceId: string) => void
  userTier: string
}

export function VoiceSelector({
  open,
  onOpenChange,
  onSelect,
  userTier
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (open) {
      fetchVoices()
    }
  }, [open])

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/voices')
      const data = await response.json()
      setVoices(data.voices)
    } catch (error) {
      console.error('Error fetching voices:', error)
    } finally {
      setLoading(false)
    }
  }

  const playPreview = (previewUrl: string, voiceId: string) => {
    if (audio) {
      audio.pause()
    }

    if (playing === voiceId) {
      setPlaying(null)
      return
    }

    const newAudio = new Audio(previewUrl)
    newAudio.play()
    newAudio.onended = () => setPlaying(null)

    setAudio(newAudio)
    setPlaying(voiceId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Voice</DialogTitle>
          <DialogDescription>
            Select a premium voice for your story
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading voices...</div>
        ) : (
          <div className="grid gap-3">
            {voices.map((voice) => (
              <div
                key={voice.voice_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:border-lavender-500 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold">{voice.name}</div>
                  <div className="text-sm text-gray-500">{voice.category}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playPreview(voice.preview_url, voice.voice_id)}
                  >
                    {playing === voice.voice_id ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      onSelect(voice.voice_id)
                      onOpenChange(false)
                    }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

#### File: `tests/integration/elevenlabs.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest'
import { generateElevenLabsAudio, getAvailableVoices } from '@/lib/elevenlabs/client'
import { cacheStoryAudio } from '@/lib/elevenlabs/audio-storage'

describe('ElevenLabs Integration', () => {
  it('should generate audio successfully', async () => {
    const text = 'Once upon a time in a magical forest'
    const voiceId = '21m00Tcm4TlvDq8ikWAM'

    const result = await generateElevenLabsAudio(text, voiceId)

    expect(result.audioBuffer).toBeInstanceOf(Buffer)
    expect(result.audioBuffer.length).toBeGreaterThan(0)
    expect(result.contentType).toBe('audio/mpeg')
  }, { timeout: 10000 })

  it('should list available voices', async () => {
    const voices = await getAvailableVoices()

    expect(voices).toBeInstanceOf(Array)
    expect(voices.length).toBeGreaterThan(0)
    expect(voices[0]).toHaveProperty('voice_id')
    expect(voices[0]).toHaveProperty('name')
  })

  it('should cache audio in storage', async () => {
    const storyId = 'test_story_123'
    const fakeAudio = Buffer.from('fake audio data')

    const url = await cacheStoryAudio(storyId, fakeAudio)

    expect(url).toContain('supabase')
    expect(url).toContain('.mp3')
  })
})
```

### **Rollback Procedure**:
1. Set all voice_provider to 'web' in stories table
2. Disable ElevenLabs API calls
3. Clear audio_url and voice_config columns
4. Keep data for future re-enable

---

## 🔧 PHASE 6: Gift Subscriptions (TDD)

### **Goal**: Build gift purchase and redemption system

### **Test Specifications**:

#### Test 6.1: Gift Purchase Flow
```typescript
describe('Gift Purchase', () => {
  it('should create gift subscription record', async () => {
    const giftData = {
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      tier: 'magic_circle',
      durationMonths: 6,
      giftMessage: 'Happy Birthday!'
    }

    const gift = await createGiftSubscription(giftData)

    expect(gift).toHaveProperty('id')
    expect(gift.redemption_code).toMatch(/^AMARI-[A-Z0-9]{8}$/)
    expect(gift.status).toBe('pending')
    expect(gift.tier).toBe('magic_circle')
  })

  it('should generate unique redemption codes', async () => {
    const codes = new Set()

    for (let i = 0; i < 100; i++) {
      const code = generateRedemptionCode()
      expect(codes.has(code)).toBe(false)
      codes.add(code)
    }

    expect(codes.size).toBe(100)
  })

  it('should calculate correct expiration date', async () => {
    const purchaseDate = new Date('2025-01-01')
    const durationMonths = 12

    const expiresAt = calculateGiftExpiration(purchaseDate, durationMonths)

    expect(expiresAt.getFullYear()).toBe(2026)
    expect(expiresAt.getMonth()).toBe(0) // January
  })
})
```

#### Test 6.2: Gift Email Delivery
```typescript
describe('Gift Email Delivery', () => {
  it('should send gift email to recipient', async () => {
    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      purchaserName: 'John Doe',
      recipientEmail: 'recipient@example.com',
      recipientName: 'Jane Smith',
      tier: 'dream_weaver',
      durationMonths: 3,
      giftMessage: 'Enjoy bedtime stories!'
    })

    const emailSent = await sendGiftEmail(gift.id)

    expect(emailSent).toBe(true)
    expect(gift.status).toBe('delivered')
  })

  it('should schedule gift delivery for future date', async () => {
    const futureDate = new Date('2025-12-25') // Christmas

    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      tier: 'magic_circle',
      durationMonths: 12,
      deliveryDate: futureDate
    })

    expect(gift.status).toBe('pending')
    expect(gift.delivery_date).toEqual(futureDate)
  })
})
```

#### Test 6.3: Gift Redemption
```typescript
describe('Gift Redemption', () => {
  it('should redeem valid gift code', async () => {
    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      tier: 'dream_weaver',
      durationMonths: 6
    })

    const user = await createTestUser()
    const result = await redeemGiftCode(gift.redemption_code, user.id)

    expect(result.success).toBe(true)
    expect(result.subscription).toBeDefined()
    expect(result.subscription.tier).toBe('dream_weaver')

    // Check user updated
    const updatedUser = await getUserById(user.id)
    expect(updatedUser.subscription_tier).toBe('dream_weaver')
  })

  it('should reject expired gift code', async () => {
    const expiredGift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      tier: 'magic_circle',
      durationMonths: 3,
      expiresAt: new Date('2020-01-01') // Past date
    })

    const user = await createTestUser()
    const result = await redeemGiftCode(expiredGift.redemption_code, user.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('expired')
  })

  it('should reject already redeemed code', async () => {
    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      tier: 'dream_weaver',
      durationMonths: 3
    })

    const user1 = await createTestUser()
    await redeemGiftCode(gift.redemption_code, user1.id)

    // Try to redeem again with different user
    const user2 = await createTestUser()
    const result = await redeemGiftCode(gift.redemption_code, user2.id)

    expect(result.success).toBe(false)
    expect(result.error).toContain('already redeemed')
  })

  it('should handle existing subscriptions on redemption', async () => {
    const user = await createUserWithTier('dream_weaver')
    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      recipientEmail: user.email,
      tier: 'magic_circle',
      durationMonths: 6
    })

    const result = await redeemGiftCode(gift.redemption_code, user.id)

    expect(result.success).toBe(true)
    expect(result.message).toContain('upgraded')

    const updatedUser = await getUserById(user.id)
    expect(updatedUser.subscription_tier).toBe('magic_circle')
  })
})
```

#### Test 6.4: Stripe Gift Checkout
```typescript
describe('Gift Checkout', () => {
  it('should create Stripe checkout for gift purchase', async () => {
    const session = await createGiftCheckoutSession({
      tier: 'magic_circle',
      durationMonths: 12,
      purchaserEmail: 'buyer@example.com',
      recipientEmail: 'recipient@example.com',
      giftMessage: 'Happy Holidays!'
    })

    expect(session.url).toBeDefined()
    expect(session.mode).toBe('payment') // One-time payment, not subscription
    expect(session.metadata).toMatchObject({
      gift_type: 'subscription',
      tier: 'magic_circle',
      duration_months: '12'
    })
  })
})
```

### **Implementation Files**:

#### File: `supabase/migrations/002_add_gift_subscriptions.sql`
```sql
-- Create gift subscriptions table
CREATE TABLE gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  tier subscription_tier NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months IN (3, 6, 12)),
  amount_paid DECIMAL(10,2) NOT NULL,
  gift_message TEXT,
  redemption_code TEXT UNIQUE NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'redeemed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gift_subscriptions_redemption_code ON gift_subscriptions(redemption_code);
CREATE INDEX idx_gift_subscriptions_status ON gift_subscriptions(status);
CREATE INDEX idx_gift_subscriptions_recipient_email ON gift_subscriptions(recipient_email);
CREATE INDEX idx_gift_subscriptions_delivery_date ON gift_subscriptions(delivery_date);

-- Enable RLS
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- Purchasers can view their gifts
CREATE POLICY "Purchasers can view own gifts" ON gift_subscriptions
  FOR SELECT USING (purchaser_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Recipients can view gifts sent to them
CREATE POLICY "Recipients can view gifts" ON gift_subscriptions
  FOR SELECT USING (recipient_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Service role can manage all
CREATE POLICY "Service role can manage gifts" ON gift_subscriptions
  FOR ALL USING (current_user = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_gift_subscriptions_updated_at
  BEFORE UPDATE ON gift_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check for expired gifts
CREATE OR REPLACE FUNCTION expire_old_gifts()
RETURNS void AS $$
BEGIN
  UPDATE gift_subscriptions
  SET status = 'expired'
  WHERE status IN ('pending', 'delivered')
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### File: `lib/gifts/gift-management.ts`
```typescript
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

export function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  let code = 'AMARI-'

  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
}

export function calculateGiftExpiration(purchaseDate: Date, durationMonths: number): Date {
  const expiresAt = new Date(purchaseDate)
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths + 12) // Add 12 months grace period
  return expiresAt
}

export interface CreateGiftParams {
  purchaserEmail: string
  purchaserName?: string
  recipientEmail: string
  recipientName?: string
  tier: string
  durationMonths: number
  amountPaid: number
  giftMessage?: string
  deliveryDate?: Date
  stripePaymentIntentId?: string
}

export async function createGiftSubscription(params: CreateGiftParams) {
  const redemptionCode = generateRedemptionCode()
  const expiresAt = calculateGiftExpiration(new Date(), params.durationMonths)

  const { data, error } = await supabaseAdmin
    .from('gift_subscriptions')
    .insert({
      purchaser_email: params.purchaserEmail,
      purchaser_name: params.purchaserName,
      recipient_email: params.recipientEmail,
      recipient_name: params.recipientName,
      tier: params.tier,
      duration_months: params.durationMonths,
      amount_paid: params.amountPaid,
      gift_message: params.giftMessage,
      redemption_code: redemptionCode,
      expires_at: expiresAt.toISOString(),
      delivery_date: params.deliveryDate?.toISOString(),
      stripe_payment_intent_id: params.stripePaymentIntentId,
      status: params.deliveryDate ? 'pending' : 'delivered'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating gift subscription:', error)
    throw error
  }

  return data
}

export async function redeemGiftCode(redemptionCode: string, userId: string) {
  // Get gift
  const { data: gift, error: giftError } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('redemption_code', redemptionCode)
    .single()

  if (giftError || !gift) {
    return {
      success: false,
      error: 'Invalid gift code'
    }
  }

  // Check if already redeemed
  if (gift.redeemed_at) {
    return {
      success: false,
      error: 'This gift code has already been redeemed'
    }
  }

  // Check if expired
  if (new Date(gift.expires_at) < new Date()) {
    await supabaseAdmin
      .from('gift_subscriptions')
      .update({ status: 'expired' })
      .eq('id', gift.id)

    return {
      success: false,
      error: 'This gift code has expired'
    }
  }

  // Get user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    return {
      success: false,
      error: 'User not found'
    }
  }

  // Calculate subscription end date
  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + gift.duration_months)

  // Update user subscription
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: gift.tier,
      subscription_status: 'premium',
      subscription_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      subscription_end_date: endDate.toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating user subscription:', updateError)
    throw updateError
  }

  // Mark gift as redeemed
  await supabaseAdmin
    .from('gift_subscriptions')
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_by: userId,
      status: 'redeemed'
    })
    .eq('id', gift.id)

  // Initialize usage tracking
  await initializeUsageTracking(userId, startDate)

  return {
    success: true,
    subscription: updatedUser,
    message: `Successfully activated ${gift.tier} subscription for ${gift.duration_months} months!`
  }
}

export async function getGiftByCode(redemptionCode: string) {
  const { data } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('redemption_code', redemptionCode)
    .single()

  return data
}

export async function getPurchaserGifts(email: string) {
  const { data } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('purchaser_email', email)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getRecipientGifts(email: string) {
  const { data } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('recipient_email', email)
    .order('created_at', { ascending: false })

  return data || []
}
```

#### File: `lib/gifts/gift-email.ts`
```typescript
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendGiftEmail(giftId: string) {
  const { data: gift } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('id', giftId)
    .single()

  if (!gift) {
    throw new Error('Gift not found')
  }

  const tierNames = {
    dream_weaver: 'Dream Weaver',
    magic_circle: 'Magic Circle',
    enchanted_library: 'Enchanted Library'
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9fafb; }
          .code { font-size: 24px; font-weight: bold; text-align: center; padding: 20px; background: white; border: 2px dashed #667eea; border-radius: 8px; margin: 20px 0; letter-spacing: 2px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 You've Received a Gift!</h1>
          </div>
          <div class="content">
            ${gift.purchaser_name ? `<p>Hi ${gift.recipient_name || 'there'}! ${gift.purchaser_name} has sent you a gift:</p>` : ''}

            <h2>${gift.duration_months} Months of ${tierNames[gift.tier]}</h2>

            ${gift.gift_message ? `<p style="background: white; padding: 15px; border-left: 4px solid #667eea; font-style: italic;">"${gift.gift_message}"</p>` : ''}

            <p>Your gift includes magical bedtime stories powered by AI, perfect for creating wonderful memories with your children.</p>

            <p><strong>Your Gift Code:</strong></p>
            <div class="code">${gift.redemption_code}</div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/redeem?code=${gift.redemption_code}" class="button">
                Redeem Your Gift
              </a>
            </p>

            <p><small>This gift code expires on ${new Date(gift.expires_at).toLocaleDateString()}. Make sure to redeem it before then!</small></p>
          </div>
          <div class="footer">
            <p>Sweet dreams from the Amari team 🦋</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">www.amari.app</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: 'Amari <gifts@amari.app>',
      to: gift.recipient_email,
      subject: `🎁 You've received ${gift.duration_months} months of magical bedtime stories!`,
      html: emailHtml
    })

    // Update status
    await supabaseAdmin
      .from('gift_subscriptions')
      .update({ status: 'delivered' })
      .eq('id', giftId)

    return true
  } catch (error) {
    console.error('Error sending gift email:', error)
    throw error
  }
}

export async function sendGiftConfirmationEmail(giftId: string) {
  const { data: gift } = await supabaseAdmin
    .from('gift_subscriptions')
    .select('*')
    .eq('id', giftId)
    .single()

  if (!gift) {
    throw new Error('Gift not found')
  }

  const tierNames = {
    dream_weaver: 'Dream Weaver',
    magic_circle: 'Magic Circle',
    enchanted_library: 'Enchanted Library'
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Gift Purchase Confirmed! 🎉</h1>

          <p>Thank you for giving the gift of magical bedtime stories!</p>

          <h3>Gift Details:</h3>
          <ul>
            <li><strong>Tier:</strong> ${tierNames[gift.tier]}</li>
            <li><strong>Duration:</strong> ${gift.duration_months} months</li>
            <li><strong>Recipient:</strong> ${gift.recipient_email}</li>
            <li><strong>Amount Paid:</strong> $${gift.amount_paid}</li>
          </ul>

          ${gift.delivery_date ? `<p>Your gift will be delivered on ${new Date(gift.delivery_date).toLocaleDateString()}</p>` : '<p>Your gift has been sent to the recipient!</p>'}

          <p>The recipient can redeem their gift using code: <strong>${gift.redemption_code}</strong></p>

          <p>Thank you for spreading bedtime magic!</p>

          <p>Best wishes,<br>The Amari Team</p>
        </div>
      </body>
    </html>
  `

  try {
    await resend.emails.send({
      from: 'Amari <gifts@amari.app>',
      to: gift.purchaser_email,
      subject: '🎁 Gift Purchase Confirmation - Amari',
      html: emailHtml
    })

    return true
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    throw error
  }
}
```

#### File: `app/api/gifts/purchase/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createGiftCheckoutSession } from '@/lib/stripe/gift-checkout'

const GIFT_PRICING = {
  dream_weaver: {
    3: 24.99,
    6: 44.99,
    12: 79.99
  },
  magic_circle: {
    3: 49.99,
    6: 89.99,
    12: 179.99
  },
  enchanted_library: {
    12: 219.99
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      tier,
      durationMonths,
      purchaserEmail,
      purchaserName,
      recipientEmail,
      recipientName,
      giftMessage,
      deliveryDate
    } = body

    // Validate pricing
    const price = GIFT_PRICING[tier as keyof typeof GIFT_PRICING]?.[durationMonths as keyof typeof GIFT_PRICING.dream_weaver]

    if (!price) {
      return NextResponse.json(
        { error: 'Invalid tier or duration' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await createGiftCheckoutSession({
      tier,
      durationMonths,
      amount: price,
      purchaserEmail,
      purchaserName,
      recipientEmail,
      recipientName,
      giftMessage,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating gift checkout:', error)
    return NextResponse.json(
      { error: 'Failed to create gift checkout' },
      { status: 500 }
    )
  }
}
```

#### File: `app/api/gifts/redeem/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { redeemGiftCode } from '@/lib/gifts/gift-management'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { code } = body

    const result = await redeemGiftCode(code, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      subscription: result.subscription
    })

  } catch (error) {
    console.error('Error redeeming gift:', error)
    return NextResponse.json(
      { error: 'Failed to redeem gift' },
      { status: 500 }
    )
  }
}
```

#### File: `app/(app)/redeem/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gift, Sparkles } from 'lucide-react'

export default function RedeemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRedeem = async () => {
    if (!code) {
      setError('Please enter a gift code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to redeem gift')
        return
      }

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-lavender-600" />
            </div>
            <CardTitle className="text-2xl">Redeem Your Gift</CardTitle>
            <CardDescription>
              Enter your gift code to activate your subscription
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Gift Redeemed!</h3>
                <p className="text-gray-600">
                  Your subscription has been activated. Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Gift Code</Label>
                  <Input
                    id="code"
                    placeholder="AMARI-XXXXXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={14}
                  />
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>

                <Button
                  onClick={handleRedeem}
                  disabled={loading || !code}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    'Redeeming...'
                  ) : (
                    <>
                      Redeem Gift <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>Gift codes are case-insensitive</p>
                  <p>Format: AMARI-XXXXXXXX</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

#### File: `tests/integration/gift-redemption.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createGiftSubscription, redeemGiftCode } from '@/lib/gifts/gift-management'
import { supabaseAdmin } from '@/lib/supabase/server'

describe('Gift Redemption Flow', () => {
  let testUserId: string

  beforeEach(async () => {
    const { data } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`
      })
      .select()
      .single()

    testUserId = data!.id
  })

  it('should complete full redemption flow', async () => {
    // Create gift
    const gift = await createGiftSubscription({
      purchaserEmail: 'buyer@example.com',
      purchaserName: 'John Doe',
      recipientEmail: 'recipient@example.com',
      recipientName: 'Jane Smith',
      tier: 'magic_circle',
      durationMonths: 6,
      amountPaid: 89.99,
      giftMessage: 'Happy Birthday!'
    })

    expect(gift.redemption_code).toBeDefined()
    expect(gift.status).toBe('delivered')

    // Redeem gift
    const result = await redeemGiftCode(gift.redemption_code, testUserId)

    expect(result.success).toBe(true)
    expect(result.subscription.subscription_tier).toBe('magic_circle')

    // Verify gift marked as redeemed
    const { data: redeemedGift } = await supabaseAdmin
      .from('gift_subscriptions')
      .select('*')
      .eq('id', gift.id)
      .single()

    expect(redeemedGift?.status).toBe('redeemed')
    expect(redeemedGift?.redeemed_by).toBe(testUserId)
  })
})
```

### **Rollback Procedure**:
1. Disable gift purchase endpoints
2. Keep gift_subscriptions table (data is valuable)
3. Honor existing unredeemed gifts
4. Stop sending new gift emails

---

## 🧪 Testing Strategy

### **Unit Tests**:
- Database functions (tier limits, usage tracking)
- Stripe product mapping
- Usage enforcement logic
- Gift code generation and validation

### **Integration Tests**:
- Webhook → Database flow
- Story generation → Usage increment
- Checkout → Tier upgrade
- Gift redemption → Subscription activation

### **E2E Tests**:
- Complete signup → checkout → story generation flow
- Limit reached → upgrade → new limits available
- Gift purchase → email → redemption → usage

---

## 📊 Success Metrics

### **Phase Completion Criteria**:

**Phase 1**:
- ✅ All migrations run without errors
- ✅ Existing data preserved
- ✅ All tier limit tests pass

**Phase 2**:
- ✅ Stripe products created
- ✅ Webhook handles all 3 tiers
- ✅ Usage tracking initialized on subscription

**Phase 3**:
- ✅ Story limits enforced
- ✅ Premium voice limits enforced
- ✅ Upgrade prompts shown correctly

**Phase 4**:
- ✅ Pricing page displays all tiers
- ✅ Checkout flow works end-to-end
- ✅ Current tier highlighted in UI

**Phase 5**:
- ✅ ElevenLabs integration working
- ✅ Voice quota enforced
- ✅ Fallback to web voice functional

**Phase 6**:
- ✅ Gift purchase flow complete
- ✅ Email delivery working
- ✅ Redemption activates subscription

---

## 🚨 Rollback Procedures

### **Phase 1 Rollback**:
```sql
-- See Phase 1 section above
```

### **Phase 2 Rollback**:
1. Revert webhook changes
2. Archive Stripe products (don't delete - may have customers)
3. Remove price ID mappings

### **Phase 3 Rollback**:
1. Remove limit checks from API routes
2. Keep tracking (data is valuable)

### **Phase 4 Rollback**:
1. Hide pricing page
2. Redirect upgrades to contact form

### **Phase 5 Rollback**:
1. Default all voices to web
2. Disable ElevenLabs API calls

### **Phase 6 Rollback**:
1. Disable gift purchase
2. Honor existing gift codes

---

## 📝 Implementation Checklist

### **Pre-Development**:
- [ ] Review and approve this plan
- [ ] Set up Stripe test mode
- [ ] Create ElevenLabs test account
- [ ] Set up staging environment
- [ ] Configure monitoring/logging

### **Phase 1**:
- [ ] Write migration SQL
- [ ] Write unit tests
- [ ] Run migration on staging
- [ ] Verify data integrity
- [ ] Deploy to production

### **Phase 2**:
- [ ] Create Stripe products script
- [ ] Update webhook handler
- [ ] Write integration tests
- [ ] Test checkout flow
- [ ] Deploy webhook updates

### **Phase 3**:
- [ ] Implement limit checking
- [ ] Update story generation API
- [ ] Write usage tests
- [ ] Test enforcement
- [ ] Deploy API updates

### **Phase 4**:
- [ ] Build pricing page
- [ ] Create upgrade prompts
- [ ] Write UI tests
- [ ] Test checkout flow
- [ ] Deploy frontend

### **Phase 5**:
- [ ] Integrate ElevenLabs
- [ ] Implement voice selection
- [ ] Write voice tests
- [ ] Test audio generation
- [ ] Deploy voice features

### **Phase 6**:
- [ ] Build gift purchase flow
- [ ] Create email templates
- [ ] Implement redemption
- [ ] Test end-to-end
- [ ] Deploy gift system

---

## 🎯 Next Steps

1. **Review this plan** - Confirm approach and timeline
2. **Environment setup** - Staging, test accounts, monitoring
3. **Begin Phase 1** - Database migrations and tests
4. **Iterate through phases** - Complete each before moving to next
5. **User testing** - Beta test with small group before full launch

---

**Ready to begin implementation? Let's start with Phase 1!**
