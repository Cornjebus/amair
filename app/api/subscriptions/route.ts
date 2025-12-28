import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/database';
import { captureError } from '@/lib/monitoring/sentry';
import { TIER_CONFIG, getTrialDaysRemaining } from '@/lib/subscription/tiers';
import type { SubscriptionTier } from '@/lib/subscription/types';

// =============================================================================
// GET /api/subscriptions - Get current user's subscription
// =============================================================================

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();

    // Get user from Clerk ID using DAL
    const user = await db.users.findByClerkId(clerkUserId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription using DAL
    const subscription = await db.subscriptions.findByUserId(user.id);

    console.log('[Subscriptions] Query result for user', user.id, ':', {
      hasSubscription: !!subscription,
      tier: subscription?.tier,
    });

    // If no subscription exists, user needs to subscribe
    if (!subscription) {
      console.log('[Subscriptions] No subscription found for user:', user.id);
      return NextResponse.json({
        tier: 'free',
        billingCycle: null,
        status: 'none',
        requiresSubscription: true, // Key flag to redirect to pricing
        currentPeriodStart: null,
        currentPeriodEnd: null,
        storiesUsed: 0,
        premiumVoicesUsed: 0,
        limits: {
          storiesPerMonth: 0,
          premiumVoicesPerMonth: 0,
          savedStories: 0,
          childProfiles: 0,
        },
        storiesRemaining: 0,
        premiumVoicesRemaining: 0,
        cancelAtPeriodEnd: false,
        isOnTrial: false,
        trialEnd: null,
        trialDaysRemaining: 0,
      });
    }

    // Get tier limits
    const tier = subscription.tier as SubscriptionTier;
    const limits = TIER_CONFIG[tier] || TIER_CONFIG.free;

    // Check for trial status from database (avoid slow Stripe API call)
    // Trial info is synced from Stripe webhooks
    let isOnTrial = false;
    let trialEnd: string | null = subscription.trialEnd || null;
    let trialDaysRemaining = 0;

    if (trialEnd) {
      const trialEndDate = new Date(trialEnd);
      if (trialEndDate > new Date()) {
        isOnTrial = true;
        trialDaysRemaining = getTrialDaysRemaining(trialEnd);
      }
    }

    return NextResponse.json({
      tier: subscription.tier,
      billingCycle: subscription.billingCycle,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      storiesUsed: subscription.storiesUsed,
      premiumVoicesUsed: subscription.premiumVoicesUsed,
      limits: {
        storiesPerMonth: limits.monthly_stories,
        premiumVoicesPerMonth: limits.monthly_premium_voices,
        savedStories: limits.max_saved_stories,
        childProfiles: limits.max_children,
      },
      storiesRemaining: Math.max(0, limits.monthly_stories - (subscription.storiesUsed ?? 0)),
      premiumVoicesRemaining: Math.max(0, limits.monthly_premium_voices - (subscription.premiumVoicesUsed ?? 0)),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      // Trial info
      isOnTrial,
      trialEnd,
      trialDaysRemaining,
    });
  } catch (error) {
    captureError(error as Error, { action: 'get_subscription' });
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
