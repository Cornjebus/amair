/**
 * Subscription Tier Management
 *
 * Handles tier configuration, limits, and feature access
 */

export type SubscriptionTier = 'free' | 'dream_weaver' | 'magic_circle' | 'enchanted_library'

export interface TierLimits {
  monthly_stories: number
  monthly_premium_voices: number
  max_children: number // -1 = unlimited
  max_saved_stories: number // -1 = unlimited
  features: {
    web_voice_only?: boolean
    downloads?: boolean
    basic_themes?: boolean
    family_sharing?: number
    premium_themes?: boolean
    scheduled_delivery?: boolean
    analytics?: boolean
    pdf_download?: boolean
    mp3_download?: boolean
    character_voices?: boolean
    custom_themes?: boolean
    priority_support?: boolean
    early_access?: boolean
    gift_per_year?: number
  }
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  free: {
    monthly_stories: 3,
    monthly_premium_voices: 0,
    max_children: 2,
    max_saved_stories: 5,
    features: {
      web_voice_only: true,
    },
  },
  dream_weaver: {
    monthly_stories: 10,
    monthly_premium_voices: 3,
    max_children: 3,
    max_saved_stories: -1, // unlimited
    features: {
      downloads: true,
      basic_themes: true,
    },
  },
  magic_circle: {
    monthly_stories: 30,
    monthly_premium_voices: 15,
    max_children: 5,
    max_saved_stories: -1,
    features: {
      family_sharing: 2,
      premium_themes: true,
      scheduled_delivery: true,
      analytics: true,
      pdf_download: true,
      mp3_download: true,
    },
  },
  enchanted_library: {
    monthly_stories: 60,
    monthly_premium_voices: 60,
    max_children: -1, // unlimited
    max_saved_stories: -1,
    features: {
      family_sharing: 4,
      character_voices: true,
      custom_themes: true,
      priority_support: true,
      early_access: true,
      gift_per_year: 1,
    },
  },
}

export interface TierInfo {
  name: string
  displayName: string
  monthlyPrice: number
  annualPrice: number
  stripePriceIdMonthly?: string
  stripePriceIdAnnual?: string
}

export const TIER_INFO: Record<SubscriptionTier, TierInfo> = {
  free: {
    name: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
  },
  dream_weaver: {
    name: 'dream_weaver',
    displayName: 'Dream Weaver',
    monthlyPrice: 6.99,
    annualPrice: 59.99,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY,
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL,
  },
  magic_circle: {
    name: 'magic_circle',
    displayName: 'Magic Circle',
    monthlyPrice: 14.99,
    annualPrice: 119.99,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY,
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL,
  },
  enchanted_library: {
    name: 'enchanted_library',
    displayName: 'Enchanted Library',
    monthlyPrice: 29.99,
    annualPrice: 249.99,
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY,
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL,
  },
}

/**
 * Get tier limits for a specific tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_CONFIG[tier]
}

/**
 * Get tier information including pricing
 */
export function getTierInfo(tier: SubscriptionTier): TierInfo {
  return TIER_INFO[tier]
}

/**
 * Check if a tier has a specific feature
 */
export function hasFeature(tier: SubscriptionTier, feature: keyof TierLimits['features']): boolean {
  return !!TIER_CONFIG[tier].features[feature]
}

/**
 * Get feature value for a tier
 */
export function getFeatureValue<T>(tier: SubscriptionTier, feature: keyof TierLimits['features']): T | undefined {
  return TIER_CONFIG[tier].features[feature] as T | undefined
}

/**
 * Check if user can perform an action based on current usage
 */
export interface UsageCheck {
  allowed: boolean
  limit: number
  current: number
  remaining: number
}

export function checkStoryLimit(tier: SubscriptionTier, currentUsage: number): UsageCheck {
  const limit = TIER_CONFIG[tier].monthly_stories
  const remaining = Math.max(0, limit - currentUsage)

  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage,
    remaining,
  }
}

export function checkPremiumVoiceLimit(tier: SubscriptionTier, currentUsage: number): UsageCheck {
  const limit = TIER_CONFIG[tier].monthly_premium_voices
  const remaining = Math.max(0, limit - currentUsage)

  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage,
    remaining,
  }
}

/**
 * Get tier hierarchy for upgrade/downgrade logic
 */
const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'dream_weaver', 'magic_circle', 'enchanted_library']

export function isUpgrade(currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY.indexOf(newTier) > TIER_HIERARCHY.indexOf(currentTier)
}

export function isDowngrade(currentTier: SubscriptionTier, newTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY.indexOf(newTier) < TIER_HIERARCHY.indexOf(currentTier)
}

export function getTierRank(tier: SubscriptionTier): number {
  return TIER_HIERARCHY.indexOf(tier)
}
