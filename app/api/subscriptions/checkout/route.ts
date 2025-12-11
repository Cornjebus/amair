import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { captureError } from '@/lib/monitoring/sentry';
import { TIER_INFO } from '@/lib/subscription/tiers';
import type { SubscriptionTier } from '@/lib/subscription/types';

// Subscription price type (not in generated types yet)
interface SubscriptionPrice {
  id: string;
  tier: string;
  billing_cycle: string;
  price_cents: number;
  stripe_price_id?: string;
}

// =============================================================================
// POST /api/subscriptions/checkout - Create checkout session for subscription
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, billingCycle = 'monthly' } = body;

    // Validate tier (free tier removed - only paid tiers available)
    const validTiers = ['dream_weaver', 'magic_circle', 'enchanted_library'];
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Determine if this tier gets a trial (Dream Weaver and Magic Circle get 14-day trial)
    const tiersWithTrial = ['dream_weaver', 'magic_circle'];
    const hasTrial = tiersWithTrial.includes(tier);

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          clerkId: clerkUserId,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get price from database or use hardcoded values (cast to any until migration)
    const { data: priceData } = await (supabaseAdmin as any)
      .from('subscription_prices')
      .select('stripe_price_id, price_cents')
      .eq('tier', tier)
      .eq('billing_cycle', billingCycle)
      .eq('is_active', true)
      .single() as { data: SubscriptionPrice | null; error: any };

    // If we have a Stripe price ID from database, use it
    let priceId = priceData?.stripe_price_id;

    // If no price ID in database, create a price dynamically
    if (!priceId) {
      const tierInfo = TIER_INFO[tier as SubscriptionTier];
      const priceCents = priceData?.price_cents ||
        (billingCycle === 'monthly' ? tierInfo.monthlyPrice * 100 : tierInfo.annualPrice * 100);

      // Create a product and price in Stripe
      const product = await stripe.products.create({
        name: `Amari ${tierInfo.displayName}`,
        description: `${tierInfo.displayName} subscription - ${billingCycle}`,
        metadata: {
          tier,
          billingCycle,
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceCents),
        currency: 'usd',
        recurring: {
          interval: billingCycle === 'monthly' ? 'month' : 'year',
        },
        metadata: {
          tier,
          billingCycle,
        },
      });

      priceId = price.id;

      // Save the price ID to database for future use (cast to any)
      await (supabaseAdmin as any)
        .from('subscription_prices')
        .update({ stripe_price_id: priceId })
        .eq('tier', tier)
        .eq('billing_cycle', billingCycle);
    }

    // Create checkout session with trial for eligible tiers
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        type: 'subscription',
        userId: user.id,
        clerkId: clerkUserId,
        tier,
        billingCycle,
        hasTrial: hasTrial ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          clerkId: clerkUserId,
          tier,
          billingCycle,
        },
        // Add 14-day trial for Dream Weaver and Magic Circle
        ...(hasTrial && { trial_period_days: 14 }),
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    captureError(error as Error, { action: 'create_subscription_checkout' });
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
