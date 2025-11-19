/**
 * Tier Management Tests
 *
 * Phase 1: Test tier configuration and feature access
 */

import { describe, it, expect } from '@jest/globals'
import {
  getTierLimits,
  getTierInfo,
  hasFeature,
  checkStoryLimit,
  checkPremiumVoiceLimit,
  isUpgrade,
  isDowngrade,
  getTierRank,
  type SubscriptionTier,
} from '@/lib/subscription/tiers'

describe('Tier Configuration', () => {
  describe('getTierLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = getTierLimits('free')

      expect(limits).toEqual({
        monthly_stories: 3,
        monthly_premium_voices: 0,
        max_children: 2,
        max_saved_stories: 5,
        features: {
          web_voice_only: true,
        },
      })
    })

    it('should return correct limits for dream_weaver tier', () => {
      const limits = getTierLimits('dream_weaver')

      expect(limits.monthly_stories).toBe(10)
      expect(limits.monthly_premium_voices).toBe(3)
      expect(limits.max_children).toBe(3)
      expect(limits.max_saved_stories).toBe(-1) // unlimited
    })

    it('should return correct limits for magic_circle tier', () => {
      const limits = getTierLimits('magic_circle')

      expect(limits.monthly_stories).toBe(30)
      expect(limits.monthly_premium_voices).toBe(15)
      expect(limits.features.family_sharing).toBe(2)
    })

    it('should return correct limits for enchanted_library tier', () => {
      const limits = getTierLimits('enchanted_library')

      expect(limits.monthly_stories).toBe(60)
      expect(limits.monthly_premium_voices).toBe(60)
      expect(limits.max_children).toBe(-1) // unlimited
      expect(limits.features.family_sharing).toBe(4)
    })
  })

  describe('getTierInfo', () => {
    it('should return pricing for each tier', () => {
      const freeTier = getTierInfo('free')
      expect(freeTier.monthlyPrice).toBe(0)
      expect(freeTier.annualPrice).toBe(0)

      const dreamWeaver = getTierInfo('dream_weaver')
      expect(dreamWeaver.monthlyPrice).toBe(6.99)
      expect(dreamWeaver.annualPrice).toBe(59.99)

      const magicCircle = getTierInfo('magic_circle')
      expect(magicCircle.monthlyPrice).toBe(14.99)
      expect(magicCircle.annualPrice).toBe(119.99)

      const enchantedLibrary = getTierInfo('enchanted_library')
      expect(enchantedLibrary.monthlyPrice).toBe(29.99)
      expect(enchantedLibrary.annualPrice).toBe(249.99)
    })
  })

  describe('hasFeature', () => {
    it('should check feature availability correctly', () => {
      expect(hasFeature('free', 'web_voice_only')).toBe(true)
      expect(hasFeature('free', 'downloads')).toBe(false)

      expect(hasFeature('dream_weaver', 'downloads')).toBe(true)
      expect(hasFeature('dream_weaver', 'premium_themes')).toBe(false)

      expect(hasFeature('magic_circle', 'premium_themes')).toBe(true)
      expect(hasFeature('magic_circle', 'custom_themes')).toBe(false)

      expect(hasFeature('enchanted_library', 'custom_themes')).toBe(true)
      expect(hasFeature('enchanted_library', 'priority_support')).toBe(true)
    })
  })
})

describe('Usage Limits', () => {
  describe('checkStoryLimit', () => {
    it('should allow generation when under limit', () => {
      const check = checkStoryLimit('free', 2)

      expect(check.allowed).toBe(true)
      expect(check.limit).toBe(3)
      expect(check.current).toBe(2)
      expect(check.remaining).toBe(1)
    })

    it('should block generation when at limit', () => {
      const check = checkStoryLimit('free', 3)

      expect(check.allowed).toBe(false)
      expect(check.limit).toBe(3)
      expect(check.current).toBe(3)
      expect(check.remaining).toBe(0)
    })

    it('should work with different tier limits', () => {
      const dreamWeaverCheck = checkStoryLimit('dream_weaver', 9)
      expect(dreamWeaverCheck.allowed).toBe(true)
      expect(dreamWeaverCheck.remaining).toBe(1)

      const magicCircleCheck = checkStoryLimit('magic_circle', 30)
      expect(magicCircleCheck.allowed).toBe(false)
    })
  })

  describe('checkPremiumVoiceLimit', () => {
    it('should block premium voice for free tier', () => {
      const check = checkPremiumVoiceLimit('free', 0)

      expect(check.allowed).toBe(false)
      expect(check.limit).toBe(0)
    })

    it('should allow premium voice for paid tiers', () => {
      const dreamWeaverCheck = checkPremiumVoiceLimit('dream_weaver', 2)
      expect(dreamWeaverCheck.allowed).toBe(true)
      expect(dreamWeaverCheck.remaining).toBe(1)

      const magicCircleCheck = checkPremiumVoiceLimit('magic_circle', 14)
      expect(magicCircleCheck.allowed).toBe(true)
      expect(magicCircleCheck.remaining).toBe(1)
    })
  })
})

describe('Tier Hierarchy', () => {
  describe('isUpgrade', () => {
    it('should detect upgrades correctly', () => {
      expect(isUpgrade('free', 'dream_weaver')).toBe(true)
      expect(isUpgrade('dream_weaver', 'magic_circle')).toBe(true)
      expect(isUpgrade('magic_circle', 'enchanted_library')).toBe(true)
      expect(isUpgrade('free', 'enchanted_library')).toBe(true)
    })

    it('should not detect same tier as upgrade', () => {
      expect(isUpgrade('free', 'free')).toBe(false)
      expect(isUpgrade('magic_circle', 'magic_circle')).toBe(false)
    })
  })

  describe('isDowngrade', () => {
    it('should detect downgrades correctly', () => {
      expect(isDowngrade('dream_weaver', 'free')).toBe(true)
      expect(isDowngrade('magic_circle', 'dream_weaver')).toBe(true)
      expect(isDowngrade('enchanted_library', 'magic_circle')).toBe(true)
      expect(isDowngrade('enchanted_library', 'free')).toBe(true)
    })

    it('should not detect same tier as downgrade', () => {
      expect(isDowngrade('free', 'free')).toBe(false)
      expect(isDowngrade('magic_circle', 'magic_circle')).toBe(false)
    })
  })

  describe('getTierRank', () => {
    it('should return correct tier ranks', () => {
      expect(getTierRank('free')).toBe(0)
      expect(getTierRank('dream_weaver')).toBe(1)
      expect(getTierRank('magic_circle')).toBe(2)
      expect(getTierRank('enchanted_library')).toBe(3)
    })
  })
})
