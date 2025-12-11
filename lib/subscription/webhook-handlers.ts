/**
 * Stripe Webhook Handlers for Subscription System
 *
 * Handles all Stripe webhook events related to subscriptions and gifts
 */

import Stripe from 'stripe'
import { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/server'
import { captureError, captureMessage } from '@/lib/monitoring/sentry'
import type { SubscriptionTier } from './tiers'

/**
 * Map Stripe price ID to subscription tier
 */
function getPriceIdToTierMap(): Record<string, SubscriptionTier> {
  const map: Record<string, SubscriptionTier> = {}

  const priceIds = [
    { tier: 'dream_weaver' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL },
    { tier: 'magic_circle' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL },
    { tier: 'enchanted_library' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL },
  ]

  priceIds.forEach(({ tier, monthly, annual }) => {
    if (monthly) map[monthly] = tier
    if (annual) map[annual] = tier
  })

  // Legacy mapping for backward compatibility
  const legacyMonthly = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
  if (legacyMonthly) map[legacyMonthly] = 'magic_circle'

  return map
}

/**
 * Get tier from Stripe subscription
 */
function getTierFromSubscription(subscription: Stripe.Subscription): SubscriptionTier {
  const priceId = subscription.items.data[0]?.price.id
  const tierMap = getPriceIdToTierMap()

  return tierMap[priceId] || 'free'
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout session completed:', {
    sessionId: session.id,
    customerId: session.customer,
    mode: session.mode,
    metadata: session.metadata,
    subscription: session.subscription,
  })

  if (session.mode !== 'subscription') {
    console.log('ℹ️ Not a subscription checkout, skipping')
    return
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string
  const clerkUserId = session.metadata?.clerk_user_id

  if (!clerkUserId) {
    console.error('❌ No clerk_user_id in session metadata:', session.metadata)
    throw new Error('No clerk_user_id in session metadata')
  }

  // Get subscription details from Stripe
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

  const tier = getTierFromSubscription(subscription)

  // Safely handle date conversion
  const now = new Date()
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : now.toISOString()
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  console.log('📝 Processing subscription upgrade:', {
    clerkUserId,
    customerId,
    subscriptionId,
    tier,
    periodStart,
    periodEnd,
  })

  // Update user in database
  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status === 'trialing' ? 'trial' : 'premium',
      subscription_period_start: periodStart,
      current_period_end: periodEnd,
      subscription_end_date: periodEnd,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('clerk_id', clerkUserId)
    .select()

  if (error) {
    console.error('❌ Error updating user subscription:', error)
    throw error
  }

  console.log('✅ User upgraded successfully:', {
    userId: updatedUser?.[0]?.id,
    clerkId: updatedUser?.[0]?.clerk_id,
    newTier: updatedUser?.[0]?.subscription_tier,
    customerId: updatedUser?.[0]?.stripe_customer_id,
  })
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const tier = getTierFromSubscription(subscription)

  // Type assertion for period dates (they always exist on active subscriptions)
  const sub = subscription as any
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : new Date().toISOString()
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : new Date().toISOString()

  console.log('🔄 Subscription updated:', {
    subscriptionId: subscription.id,
    customerId,
    tier,
    status: subscription.status,
  })

  // Determine subscription status
  let status: 'free' | 'premium' | 'trial' = 'free'
  if (subscription.status === 'active') {
    status = 'premium'
  } else if (subscription.status === 'trialing') {
    status = 'trial'
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      subscription_period_start: periodStart,
      current_period_end: periodEnd,
      subscription_end_date: periodEnd,
      stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('❌ Error updating subscription:', error)
    throw error
  }

  console.log('✅ Subscription updated successfully')
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  console.log('🗑️ Subscription deleted:', {
    subscriptionId: subscription.id,
    customerId,
  })

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'free',
      subscription_end_date: null,
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('❌ Error canceling subscription:', error)
    throw error
  }

  console.log('✅ Subscription canceled successfully')
}

/**
 * Handle invoice.payment_failed event
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  console.log('💳 Payment failed:', {
    invoiceId: invoice.id,
    customerId,
    amountDue: invoice.amount_due,
  })

  // Update user status to indicate payment issue
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'free', // Could be 'past_due' if you add that status
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('❌ Error updating user after payment failure:', error)
  }

  // TODO: Send email notification to user
  console.log('⚠️ User should be notified of payment failure')
}

/**
 * Handle invoice.payment_succeeded event
 */
export async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  console.log('✅ Payment succeeded:', {
    invoiceId: invoice.id,
    customerId,
    amountPaid: invoice.amount_paid,
  })

  // Ensure subscription is marked as active
  const subscriptionId = (invoice as any).subscription
  if (subscriptionId) {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await handleSubscriptionUpdated(subscription)
  }
}

// =============================================================================
// NEW SUBSCRIPTION SYSTEM HANDLERS
// =============================================================================

/**
 * Handle new subscription checkout completion
 */
export async function handleNewSubscription(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const metadata = session.metadata
  if (!metadata) {
    console.error('[Webhook] No metadata in subscription checkout session')
    return
  }

  const userId = metadata.userId
  const tier = metadata.tier as SubscriptionTier
  const billingCycle = metadata.billingCycle as 'monthly' | 'annual'
  const stripeSubscriptionId = session.subscription as string
  const stripeCustomerId = session.customer as string

  if (!userId || !tier) {
    captureMessage('Invalid subscription checkout metadata', 'warning', {
      sessionId: session.id,
      metadata,
    })
    return
  }

  try {
    // Get subscription details from Stripe
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const sub = subscription as any

    // Safely handle date conversion
    const now = new Date()
    const periodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString()
      : now.toISOString()
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Create or update user_subscriptions record
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        tier,
        billing_cycle: billingCycle,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stories_used: 0,
        premium_voices_used: 0,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: stripeCustomerId,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) throw error

    // Also update the users table for backward compatibility
    await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: 'premium',
        subscription_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .eq('id', userId)

    // Record in subscription history
    await supabase.from('subscription_history').insert({
      user_id: userId,
      event_type: 'created',
      to_tier: tier,
      billing_cycle: billingCycle,
      metadata: {
        stripeSessionId: session.id,
        stripeSubscriptionId,
      },
    })

    captureMessage('Subscription created', 'info', {
      userId,
      tier,
      billingCycle,
    })

    console.log(`[Webhook] Subscription created for user ${userId}: ${tier} (${billingCycle})`)
  } catch (error) {
    captureError(error as Error, {
      action: 'handle_new_subscription',
      userId,
      metadata: { sessionId: session.id },
    })
    throw error
  }
}

/**
 * Handle gift purchase checkout completion
 */
export async function handleGiftPurchaseCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  const metadata = session.metadata
  if (!metadata || metadata.type !== 'gift_purchase') {
    console.log('[Webhook] Not a gift purchase')
    return
  }

  const redemptionCode = metadata.redemptionCode
  const paymentIntentId = session.payment_intent as string

  if (!redemptionCode) {
    captureMessage('No redemption code in gift checkout', 'warning', {
      sessionId: session.id,
    })
    return
  }

  try {
    // Update the gift subscription record to confirm payment
    const { data: gift, error } = await supabase
      .from('gift_subscriptions')
      .update({
        stripe_payment_intent_id: paymentIntentId,
        status: 'pending', // Ready for redemption
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_checkout_session_id', session.id)
      .select()
      .single()

    if (error) throw error

    captureMessage('Gift purchase completed', 'info', {
      giftId: gift?.id,
      redemptionCode,
      tier: metadata.tier,
      purchaserEmail: metadata.purchaserEmail,
    })

    console.log(`[Webhook] Gift purchase completed: ${redemptionCode}`)

    // TODO: Send email to purchaser with redemption code
    // TODO: If recipient email provided and delivery date is today/past, send gift email
  } catch (error) {
    captureError(error as Error, {
      action: 'handle_gift_purchase',
      metadata: { sessionId: session.id },
    })
    throw error
  }
}

// =============================================================================
// TRIAL SYSTEM HANDLERS
// =============================================================================

/**
 * Handle customer.subscription.trial_will_end event
 * Stripe sends this 3 days before trial ends
 */
export async function handleTrialWillEnd(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient
) {
  const customerId = subscription.customer as string
  const tier = getTierFromSubscription(subscription)

  // Get trial end date
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null

  console.log('[Webhook] Trial will end:', {
    subscriptionId: subscription.id,
    customerId,
    tier,
    trialEnd: trialEnd?.toISOString(),
  })

  try {
    // Get user by Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('stripe_customer_id', customerId)
      .single()

    if (userError || !user) {
      console.error('[Webhook] User not found for trial_will_end:', customerId)
      return
    }

    // Send trial ending email
    const { sendTrialEndingEmail } = await import('@/lib/email/resend')
    const { TIER_INFO } = await import('@/lib/subscription/tiers')

    const tierInfo = TIER_INFO[tier]

    await sendTrialEndingEmail(user.email, {
      name: user.first_name || 'there',
      tierName: tierInfo.displayName,
      trialEndDate: trialEnd?.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }) || 'soon',
      price: `$${tierInfo.monthlyPrice}/month`,
    })

    captureMessage('Trial ending email sent', 'info', {
      userId: user.id,
      tier,
      trialEnd: trialEnd?.toISOString(),
    })

    console.log(`[Webhook] Trial ending email sent to ${user.email}`)
  } catch (error) {
    captureError(error as Error, {
      action: 'handle_trial_will_end',
      metadata: { customerId, subscriptionId: subscription.id },
    })
    // Don't throw - email failure shouldn't fail the webhook
  }
}
