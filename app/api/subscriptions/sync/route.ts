import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { captureError } from '@/lib/monitoring/sentry';
import { TIER_CONFIG } from '@/lib/subscription/tiers';
import type { SubscriptionTier } from '@/lib/subscription/types';

// Map Stripe price ID to tier
function getTierFromPriceId(priceId: string): SubscriptionTier {
  const priceIdMap: Record<string, SubscriptionTier> = {};

  // Add all possible price ID mappings
  const envMappings = [
    { tier: 'dream_weaver' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL },
    { tier: 'magic_circle' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL },
    { tier: 'enchanted_library' as SubscriptionTier, monthly: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY, annual: process.env.NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL },
  ];

  envMappings.forEach(({ tier, monthly, annual }) => {
    if (monthly) priceIdMap[monthly] = tier;
    if (annual) priceIdMap[annual] = tier;
  });

  return priceIdMap[priceId] || 'free';
}

// =============================================================================
// POST /api/subscriptions/sync - Sync subscription from Stripe
// =============================================================================
// This is a fallback for when the webhook fails to process

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_customer_id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripe_customer_id) {
      return NextResponse.json({
        error: 'No Stripe customer found',
        tier: 'free',
      }, { status: 200 });
    }

    const stripe = getStripe();

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - ensure user is on free tier
      return NextResponse.json({
        synced: true,
        tier: 'free',
        message: 'No active subscription found',
      });
    }

    const stripeSubscription = subscriptions.data[0] as any;
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    const tier = getTierFromPriceId(priceId);

    // Determine billing cycle from price interval
    const interval = stripeSubscription.items.data[0]?.price?.recurring?.interval;
    const billingCycle = interval === 'year' ? 'annual' : 'monthly';

    // Safely handle date conversion
    const now = new Date();
    const periodStartTimestamp = stripeSubscription.current_period_start;
    const periodEndTimestamp = stripeSubscription.current_period_end;

    const periodStart = periodStartTimestamp
      ? new Date(periodStartTimestamp * 1000).toISOString()
      : now.toISOString();
    const periodEnd = periodEndTimestamp
      ? new Date(periodEndTimestamp * 1000).toISOString()
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    console.log('[Sync] Syncing subscription:', {
      userId: user.id,
      stripeSubscriptionId: stripeSubscription.id,
      tier,
      billingCycle,
      periodEnd,
    });

    // Upsert to user_subscriptions table
    const { error: upsertError } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        tier,
        billing_cycle: billingCycle,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        stories_used: 0,
        premium_voices_used: 0,
        stripe_subscription_id: stripeSubscription.id,
        stripe_customer_id: user.stripe_customer_id,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('[Sync] Error upserting subscription:', upsertError);
      throw upsertError;
    }

    // Also update the users table for backward compatibility
    await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: tier,
        subscription_status: 'premium',
        subscription_period_start: periodStart,
        current_period_end: periodEnd,
        stripe_subscription_id: stripeSubscription.id,
      })
      .eq('id', user.id);

    // Get tier limits for response
    const limits = TIER_CONFIG[tier] || TIER_CONFIG.free;

    return NextResponse.json({
      synced: true,
      tier,
      billingCycle,
      status: 'active',
      currentPeriodEnd: periodEnd,
      storiesRemaining: limits.monthly_stories,
      premiumVoicesRemaining: limits.monthly_premium_voices,
      limits: {
        storiesPerMonth: limits.monthly_stories,
        premiumVoicesPerMonth: limits.monthly_premium_voices,
      },
    });
  } catch (error) {
    captureError(error as Error, { action: 'sync_subscription' });
    console.error('Sync subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
