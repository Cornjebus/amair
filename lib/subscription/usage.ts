/**
 * Usage Tracking Service
 *
 * Tracks story generation and premium voice usage per billing period
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import type { SubscriptionTier } from './tiers'
import { checkStoryLimit, checkPremiumVoiceLimit } from './tiers'

export interface UsageRecord {
  id: string
  user_id: string
  billing_period_start: string
  billing_period_end: string
  stories_generated: number
  premium_voices_used: number
  created_at: string
  updated_at: string
}

export interface CurrentUsage {
  stories_generated: number
  premium_voices_used: number
  billing_period_start: string
  billing_period_end: string
}

/**
 * Get current billing period dates
 */
export function getCurrentBillingPeriod(subscriptionPeriodStart?: Date): { start: Date; end: Date } {
  const now = new Date()

  if (subscriptionPeriodStart) {
    // Use subscription start date as anchor
    const start = new Date(subscriptionPeriodStart)
    const end = new Date(start)

    // Find current period by adding months
    while (end < now) {
      end.setMonth(end.getMonth() + 1)
    }

    return { start, end }
  } else {
    // For free users, use calendar month
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return { start, end }
  }
}

/**
 * Get or create current usage record for a user
 */
export async function getCurrentUsage(userId: string, subscriptionPeriodStart?: Date): Promise<CurrentUsage> {
  const { start, end } = getCurrentBillingPeriod(subscriptionPeriodStart)

  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

  // Try to get existing record
  const { data: existingUsage, error: fetchError } = await supabaseAdmin
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('billing_period_start', startDate)
    .single()

  if (existingUsage) {
    return {
      stories_generated: existingUsage.stories_generated || 0,
      premium_voices_used: existingUsage.premium_voices_used || 0,
      billing_period_start: existingUsage.billing_period_start,
      billing_period_end: existingUsage.billing_period_end,
    }
  }

  // Create new record for this billing period
  const { data: newUsage, error: createError } = await supabaseAdmin
    .from('usage_tracking')
    .insert({
      user_id: userId,
      billing_period_start: startDate,
      billing_period_end: endDate,
      stories_generated: 0,
      premium_voices_used: 0,
    })
    .select()
    .single()

  if (createError || !newUsage) {
    throw new Error(`Failed to create usage record: ${createError?.message}`)
  }

  return {
    stories_generated: 0,
    premium_voices_used: 0,
    billing_period_start: startDate,
    billing_period_end: endDate,
  }
}

/**
 * Track a story generation
 */
export async function trackStoryGeneration(
  userId: string,
  options: {
    usedPremiumVoice?: boolean
    subscriptionPeriodStart?: Date
  } = {}
): Promise<CurrentUsage> {
  const { start, end } = getCurrentBillingPeriod(options.subscriptionPeriodStart)
  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]

  // Upsert usage record
  const { data, error } = await supabaseAdmin
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      billing_period_start: startDate,
      billing_period_end: endDate,
      stories_generated: 1,
      premium_voices_used: options.usedPremiumVoice ? 1 : 0,
    }, {
      onConflict: 'user_id,billing_period_start',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    // If upsert failed, try increment
    const current = await getCurrentUsage(userId, options.subscriptionPeriodStart)

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('usage_tracking')
      .update({
        stories_generated: current.stories_generated + 1,
        premium_voices_used: current.premium_voices_used + (options.usedPremiumVoice ? 1 : 0),
      })
      .eq('user_id', userId)
      .eq('billing_period_start', startDate)
      .select()
      .single()

    if (updateError || !updated) {
      throw new Error(`Failed to track story generation: ${updateError?.message}`)
    }

    return {
      stories_generated: updated.stories_generated || 0,
      premium_voices_used: updated.premium_voices_used || 0,
      billing_period_start: updated.billing_period_start,
      billing_period_end: updated.billing_period_end,
    }
  }

  return {
    stories_generated: data.stories_generated || 0,
    premium_voices_used: data.premium_voices_used || 0,
    billing_period_start: data.billing_period_start,
    billing_period_end: data.billing_period_end,
  }
}

/**
 * Check if user can generate a story
 */
export async function canGenerateStory(
  userId: string,
  tier: SubscriptionTier,
  usePremiumVoice: boolean,
  subscriptionPeriodStart?: Date
): Promise<{
  allowed: boolean
  reason?: string
  storyCheck: ReturnType<typeof checkStoryLimit>
  voiceCheck?: ReturnType<typeof checkPremiumVoiceLimit>
}> {
  const usage = await getCurrentUsage(userId, subscriptionPeriodStart)

  const storyCheck = checkStoryLimit(tier, usage.stories_generated)

  if (!storyCheck.allowed) {
    return {
      allowed: false,
      reason: `Monthly story limit reached (${storyCheck.limit}/${storyCheck.limit})`,
      storyCheck,
    }
  }

  if (usePremiumVoice) {
    const voiceCheck = checkPremiumVoiceLimit(tier, usage.premium_voices_used)

    if (!voiceCheck.allowed) {
      return {
        allowed: false,
        reason: `Monthly premium voice limit reached (${voiceCheck.limit}/${voiceCheck.limit})`,
        storyCheck,
        voiceCheck,
      }
    }

    return {
      allowed: true,
      storyCheck,
      voiceCheck,
    }
  }

  return {
    allowed: true,
    storyCheck,
  }
}

/**
 * Reset usage for testing purposes
 */
export async function resetUsage(userId: string): Promise<void> {
  await supabaseAdmin
    .from('usage_tracking')
    .delete()
    .eq('user_id', userId)
}
