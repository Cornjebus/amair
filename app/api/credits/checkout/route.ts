import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { captureError } from '@/lib/monitoring/sentry';
import { getStripe } from '@/lib/stripe/server';

// =============================================================================
// POST /api/credits/checkout - Create Stripe checkout session for credits
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId } = body;
    // SECURITY: We only accept packageId - pricing comes from database only

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Package interface
    interface CreditPackage {
      id: string;
      name: string;
      credits: number;
      bonus_credits: number;
      price_cents: number;
      currency: string;
    }

    // SECURITY: Only get package from database - never accept client-provided pricing
    const { data: dbPkg, error: pkgError } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (pkgError || !dbPkg) {
      return NextResponse.json(
        { error: 'Credit package not found or inactive' },
        { status: 404 }
      );
    }

    const pkg: CreditPackage = {
      id: dbPkg.id,
      name: dbPkg.name,
      credits: dbPkg.credits,
      bonus_credits: dbPkg.bonus_credits ?? 0,
      price_cents: dbPkg.price_cents,
      currency: dbPkg.currency ?? 'usd',
    };

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          clerkId: userId,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pkg.currency || 'usd',
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits${pkg.bonus_credits ? ` + ${pkg.bonus_credits} bonus` : ''}`,
              metadata: {
                packageId: pkg.id,
                credits: pkg.credits.toString(),
                bonusCredits: (pkg.bonus_credits || 0).toString(),
              },
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        credits: pkg.credits.toString(),
        bonusCredits: (pkg.bonus_credits || 0).toString(),
        type: 'credit_purchase',
      },
    });

    // Create pending purchase record (only if table exists)
    try {
      await supabaseAdmin.from('credit_purchases').insert({
        user_id: user.id,
        package_id: pkg.id,
        credits_purchased: pkg.credits,
        bonus_credits: pkg.bonus_credits || 0,
        amount_cents: pkg.price_cents,
        currency: pkg.currency || 'USD',
        stripe_checkout_session_id: session.id,
        status: 'pending',
      });
    } catch (purchaseError) {
      // Table may not exist yet, continue anyway
      console.warn('Could not create purchase record:', purchaseError);
    }

    return NextResponse.json({
      checkoutUrl: session.url,
      url: session.url, // Alias for backwards compatibility
      sessionId: session.id,
    });
  } catch (error) {
    captureError(error as Error, { action: 'create_checkout' });
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
