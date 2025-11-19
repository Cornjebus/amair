/**
 * Stripe Webhook Handlers for Subscription System
 *
 * Handles all Stripe webhook events related to subscriptions
 */

import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/server'
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
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const tier = getTierFromSubscription(subscription)
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString()
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

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
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await handleSubscriptionUpdated(subscription)
  }
}
