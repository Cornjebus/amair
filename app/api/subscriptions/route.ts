import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { captureError } from '@/lib/monitoring/sentry';
import { TIER_CONFIG } from '@/lib/subscription/tiers';
import type { SubscriptionTier } from '@/lib/subscription/types';

// User subscription type (not in generated types yet)
interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  billing_cycle: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stories_used: number;
  premium_voices_used: number;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
}

// =============================================================================
// GET /api/subscriptions - Get current user's subscription
// =============================================================================

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription (cast to any until migration runs)
    const { data: subscription, error: subError } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single() as { data: UserSubscription | null; error: any };

    console.log('[Subscriptions] Query result for user', user.id, ':', {
      hasSubscription: !!subscription,
      tier: subscription?.tier,
      error: subError?.message,
    });

    // If no subscription exists, return free tier defaults
    if (subError || !subscription) {
      console.log('[Subscriptions] Returning free tier defaults for user:', user.id);
      const freeLimits = TIER_CONFIG.free;
      return NextResponse.json({
        tier: 'free',
        billingCycle: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        storiesUsed: 0,
        premiumVoicesUsed: 0,
        limits: {
          storiesPerMonth: freeLimits.monthly_stories,
          premiumVoicesPerMonth: freeLimits.monthly_premium_voices,
          savedStories: freeLimits.max_saved_stories,
          childProfiles: freeLimits.max_children,
        },
        storiesRemaining: freeLimits.monthly_stories,
        premiumVoicesRemaining: freeLimits.monthly_premium_voices,
        cancelAtPeriodEnd: false,
      });
    }

    // Get tier limits
    const tier = subscription.tier as SubscriptionTier;
    const limits = TIER_CONFIG[tier] || TIER_CONFIG.free;

    return NextResponse.json({
      tier: subscription.tier,
      billingCycle: subscription.billing_cycle,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      storiesUsed: subscription.stories_used,
      premiumVoicesUsed: subscription.premium_voices_used,
      limits: {
        storiesPerMonth: limits.monthly_stories,
        premiumVoicesPerMonth: limits.monthly_premium_voices,
        savedStories: limits.max_saved_stories,
        childProfiles: limits.max_children,
      },
      storiesRemaining: Math.max(0, limits.monthly_stories - subscription.stories_used),
      premiumVoicesRemaining: Math.max(0, limits.monthly_premium_voices - subscription.premium_voices_used),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      stripeCustomerId: subscription.stripe_customer_id,
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
