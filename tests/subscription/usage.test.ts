/**
 * Usage Tracking Tests
 *
 * Phase 1: Test usage tracking and billing period management
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  getCurrentBillingPeriod,
  getCurrentUsage,
  trackStoryGeneration,
  canGenerateStory,
  resetUsage,
  type CurrentUsage,
} from '@/lib/subscription/usage'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/lib/subscription/tiers'

// Mock user ID for testing
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

describe('Billing Period Management', () => {
  describe('getCurrentBillingPeriod', () => {
    it('should return calendar month for free users', () => {
      const { start, end } = getCurrentBillingPeriod()

      const now = new Date()
      expect(start.getMonth()).toBe(now.getMonth())
      expect(start.getDate()).toBe(1)
      expect(end.getMonth()).toBe(now.getMonth())
    })

    it('should use subscription start date for paid users', () => {
      const subscriptionStart = new Date('2025-01-15')
      const { start, end } = getCurrentBillingPeriod(subscriptionStart)

      expect(start.getDate()).toBe(15)
      expect(end.getDate()).toBe(14) // Day before next billing
    })

    it('should handle mid-month subscriptions correctly', () => {
      const subscriptionStart = new Date('2025-01-20')
      const { start, end } = getCurrentBillingPeriod(subscriptionStart)

      // Should span from 20th to 19th of next month
      expect(start.getDate()).toBe(20)
      expect(end.getMonth()).toBe(subscriptionStart.getMonth() + 1)
    })
  })
})

describe('Usage Tracking', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await resetUsage(TEST_USER_ID)
  })

  afterEach(async () => {
    // Clean up test data after each test
    await resetUsage(TEST_USER_ID)
  })

  describe('getCurrentUsage', () => {
    it('should create new usage record if none exists', async () => {
      const usage = await getCurrentUsage(TEST_USER_ID)

      expect(usage.stories_generated).toBe(0)
      expect(usage.premium_voices_used).toBe(0)
      expect(usage.billing_period_start).toBeDefined()
      expect(usage.billing_period_end).toBeDefined()
    })

    it('should return existing usage record', async () => {
      // Create initial record
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })

      // Fetch again
      const usage = await getCurrentUsage(TEST_USER_ID)

      expect(usage.stories_generated).toBe(1)
      expect(usage.premium_voices_used).toBe(1)
    })

    it('should handle different billing periods', async () => {
      const subscriptionStart = new Date('2025-01-15')
      const usage = await getCurrentUsage(TEST_USER_ID, subscriptionStart)

      expect(usage.billing_period_start).toContain('-15')
    })
  })

  describe('trackStoryGeneration', () => {
    it('should increment story count', async () => {
      await trackStoryGeneration(TEST_USER_ID)
      const usage = await getCurrentUsage(TEST_USER_ID)

      expect(usage.stories_generated).toBe(1)
      expect(usage.premium_voices_used).toBe(0)
    })

    it('should track premium voice usage', async () => {
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
      const usage = await getCurrentUsage(TEST_USER_ID)

      expect(usage.stories_generated).toBe(1)
      expect(usage.premium_voices_used).toBe(1)
    })

    it('should handle multiple story generations', async () => {
      await trackStoryGeneration(TEST_USER_ID)
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
      await trackStoryGeneration(TEST_USER_ID)

      const usage = await getCurrentUsage(TEST_USER_ID)

      expect(usage.stories_generated).toBe(3)
      expect(usage.premium_voices_used).toBe(1)
    })

    it('should create separate records for different billing periods', async () => {
      // Track in current period
      await trackStoryGeneration(TEST_USER_ID)

      // Simulate next billing period
      const nextPeriod = new Date()
      nextPeriod.setMonth(nextPeriod.getMonth() + 1)

      const nextUsage = await getCurrentUsage(TEST_USER_ID, nextPeriod)

      // New period should start at 0
      expect(nextUsage.stories_generated).toBe(0)
    })
  })

  describe('canGenerateStory', () => {
    it('should allow generation when under free tier limit', async () => {
      await trackStoryGeneration(TEST_USER_ID)
      await trackStoryGeneration(TEST_USER_ID)

      const result = await canGenerateStory(TEST_USER_ID, 'free', false)

      expect(result.allowed).toBe(true)
      expect(result.storyCheck.remaining).toBe(1)
    })

    it('should block generation when at free tier limit', async () => {
      await trackStoryGeneration(TEST_USER_ID)
      await trackStoryGeneration(TEST_USER_ID)
      await trackStoryGeneration(TEST_USER_ID)

      const result = await canGenerateStory(TEST_USER_ID, 'free', false)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Monthly story limit reached')
    })

    it('should block premium voice for free tier', async () => {
      const result = await canGenerateStory(TEST_USER_ID, 'free', true)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('premium voice limit')
    })

    it('should allow premium voice for dream_weaver tier', async () => {
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })

      const result = await canGenerateStory(TEST_USER_ID, 'dream_weaver', true)

      expect(result.allowed).toBe(true)
      expect(result.voiceCheck?.remaining).toBe(1)
    })

    it('should block when premium voice limit reached', async () => {
      // Use all 3 premium voices for dream_weaver
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
      await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })

      const result = await canGenerateStory(TEST_USER_ID, 'dream_weaver', true)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('premium voice limit')
    })

    it('should allow more stories for higher tiers', async () => {
      // Generate 20 stories
      for (let i = 0; i < 20; i++) {
        await trackStoryGeneration(TEST_USER_ID)
      }

      // Should be blocked for free tier
      const freeResult = await canGenerateStory(TEST_USER_ID, 'free', false)
      expect(freeResult.allowed).toBe(false)

      // Should be blocked for dream_weaver (limit 10)
      const dreamWeaverResult = await canGenerateStory(TEST_USER_ID, 'dream_weaver', false)
      expect(dreamWeaverResult.allowed).toBe(false)

      // Should be allowed for magic_circle (limit 30)
      const magicCircleResult = await canGenerateStory(TEST_USER_ID, 'magic_circle', false)
      expect(magicCircleResult.allowed).toBe(true)
      expect(magicCircleResult.storyCheck.remaining).toBe(10)
    })
  })
})

describe('Usage Reset', () => {
  it('should reset usage for billing period rollover', async () => {
    await trackStoryGeneration(TEST_USER_ID, { usedPremiumVoice: true })
    await trackStoryGeneration(TEST_USER_ID)

    await resetUsage(TEST_USER_ID)

    const usage = await getCurrentUsage(TEST_USER_ID)
    expect(usage.stories_generated).toBe(0)
    expect(usage.premium_voices_used).toBe(0)
  })
})
