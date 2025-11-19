/**
 * Subscription Management Service
 *
 * Handles subscription creation, upgrades, downgrades, and tier changes
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'
import type { SubscriptionTier } from './tiers'
import { TIER_INFO, isUpgrade, isDowngrade } from './tiers'

export interface SubscriptionDetails {
  tier: SubscriptionTier
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  current_period_start: string
  current_period_end: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  cancel_at_period_end: boolean
}

/**
 * Get user's current subscription details
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionDetails | null> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('subscription_tier, subscription_status, subscription_period_start, current_period_end, stripe_subscription_id, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return null
  }

  return {
    tier: (user.subscription_tier || 'free') as SubscriptionTier,
    status: mapSubscriptionStatus(user.subscription_status || 'free'),
    current_period_start: user.subscription_period_start || new Date().toISOString(),
    current_period_end: user.current_period_end || new Date().toISOString(),
    stripe_subscription_id: user.stripe_subscription_id || undefined,
    stripe_customer_id: user.stripe_customer_id || undefined,
    cancel_at_period_end: false, // Will be fetched from Stripe if needed
  }
}

/**
 * Map old subscription_status to new status format
 */
function mapSubscriptionStatus(oldStatus: string): SubscriptionDetails['status'] {
  switch (oldStatus) {
    case 'premium':
      return 'active'
    case 'trial':
      return 'trialing'
    case 'free':
    default:
      return 'canceled'
  }
}

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(params: {
  userId: string
  clerkUserId: string
  tier: SubscriptionTier
  billingPeriod: 'monthly' | 'annual'
  successUrl: string
  cancelUrl: string
}): Promise<{ sessionId: string; url: string }> {
  const { userId, clerkUserId, tier, billingPeriod, successUrl, cancelUrl } = params

  if (tier === 'free') {
    throw new Error('Cannot create checkout session for free tier')
  }

  const stripe = getStripe()
  const tierInfo = TIER_INFO[tier]

  // Get or create Stripe customer
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single()

  let customerId = user?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: {
        clerk_user_id: clerkUserId,
        user_id: userId,
      },
    })

    customerId = customer.id

    // Update user with customer ID
    await supabaseAdmin
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  // Get price ID
  const priceId = billingPeriod === 'monthly'
    ? tierInfo.stripePriceIdMonthly
    : tierInfo.stripePriceIdAnnual

  if (!priceId) {
    throw new Error(`No price ID configured for ${tier} ${billingPeriod}`)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      clerk_user_id: clerkUserId,
      user_id: userId,
      tier,
      billing_period: billingPeriod,
    },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}

/**
 * Handle subscription upgrade/downgrade
 */
export async function changeSubscription(params: {
  userId: string
  newTier: SubscriptionTier
  billingPeriod?: 'monthly' | 'annual'
}): Promise<{ success: boolean; message: string }> {
  const { userId, newTier, billingPeriod = 'monthly' } = params

  const currentSub = await getUserSubscription(userId)

  if (!currentSub) {
    return { success: false, message: 'No subscription found' }
  }

  // Handle downgrade to free
  if (newTier === 'free') {
    if (!currentSub.stripe_subscription_id) {
      return { success: false, message: 'No active subscription to cancel' }
    }

    const stripe = getStripe()
    await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return {
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    }
  }

  // Handle upgrade/downgrade
  if (!currentSub.stripe_subscription_id) {
    return {
      success: false,
      message: 'Cannot change tier without active subscription. Please create a new subscription.',
    }
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)

  const tierInfo = TIER_INFO[newTier]
  const newPriceId = billingPeriod === 'monthly'
    ? tierInfo.stripePriceIdMonthly
    : tierInfo.stripePriceIdAnnual

  if (!newPriceId) {
    return { success: false, message: `No price ID configured for ${newTier}` }
  }

  // Update subscription with new price
  const updatedSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: isUpgrade(currentSub.tier, newTier) ? 'create_prorations' : 'none',
  })

  // Update database
  await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: newTier,
    })
    .eq('id', userId)

  return {
    success: true,
    message: isUpgrade(currentSub.tier, newTier)
      ? 'Subscription upgraded successfully'
      : 'Subscription will be downgraded at the end of the billing period',
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string, immediate = false): Promise<{ success: boolean; message: string }> {
  const currentSub = await getUserSubscription(userId)

  if (!currentSub || !currentSub.stripe_subscription_id) {
    return { success: false, message: 'No active subscription to cancel' }
  }

  const stripe = getStripe()

  if (immediate) {
    // Cancel immediately
    await stripe.subscriptions.cancel(currentSub.stripe_subscription_id)

    // Update database
    await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_status: 'free',
        subscription_end_date: null,
      })
      .eq('id', userId)

    return { success: true, message: 'Subscription canceled immediately' }
  } else {
    // Cancel at period end
    await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return { success: true, message: 'Subscription will be canceled at the end of the billing period' }
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(userId: string): Promise<{ success: boolean; message: string }> {
  const currentSub = await getUserSubscription(userId)

  if (!currentSub || !currentSub.stripe_subscription_id) {
    return { success: false, message: 'No subscription to reactivate' }
  }

  const stripe = getStripe()

  // Remove cancel_at_period_end flag
  await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  return { success: true, message: 'Subscription reactivated successfully' }
}

/**
 * Get Stripe portal URL for subscription management
 */
export async function getPortalUrl(userId: string, returnUrl: string): Promise<string> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!user?.stripe_customer_id) {
    throw new Error('No Stripe customer found')
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl,
  })

  return session.url
}
