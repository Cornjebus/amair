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

    // If no subscription exists, return free tier defaults
    if (subError || !subscription) {
      const freeLimits = TIER_CONFIG.free;
      return NextResponse.json({
        tier: 'free',
        billing_cycle: 'free',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stories_used: 0,
        premium_voices_used: 0,
        limits: freeLimits,
        stories_remaining: freeLimits.monthly_stories,
        premium_voices_remaining: freeLimits.monthly_premium_voices,
        cancel_at_period_end: false,
      });
    }

    // Get tier limits
    const tier = subscription.tier as SubscriptionTier;
    const limits = TIER_CONFIG[tier] || TIER_CONFIG.free;

    return NextResponse.json({
      ...subscription,
      limits,
      stories_remaining: Math.max(0, limits.monthly_stories - subscription.stories_used),
      premium_voices_remaining: Math.max(0, limits.monthly_premium_voices - subscription.premium_voices_used),
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
