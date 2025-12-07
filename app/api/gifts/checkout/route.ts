import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/server';
import { captureError } from '@/lib/monitoring/sentry';

// Type for gift package (tables not in generated types yet)
interface GiftPackage {
  id: string;
  name: string;
  slug: string;
  tier: string;
  duration_months: number;
  price_cents: number;
  currency: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

// =============================================================================
// POST /api/gifts/checkout - Create checkout session for gift purchase
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Auth is optional for gift purchases (guests can buy gifts)
    const { userId: clerkUserId } = await auth();

    const body = await request.json();
    const {
      packageId,
      purchaserEmail,
      purchaserName,
      recipientEmail,
      recipientName,
      giftMessage,
      deliveryDate,
    } = body;

    // Validate required fields
    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    if (!purchaserEmail) {
      return NextResponse.json(
        { error: 'Purchaser email is required' },
        { status: 400 }
      );
    }

    // Get the gift package (cast to any until migration runs)
    const { data: pkg, error: pkgError } = await (supabaseAdmin as any)
      .from('gift_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single() as { data: GiftPackage | null; error: any };

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Gift package not found' },
        { status: 404 }
      );
    }

    // Get user if logged in
    let userId: string | null = null;
    let customerId: string | undefined = undefined;

    if (clerkUserId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, stripe_customer_id')
        .eq('clerk_id', clerkUserId)
        .single();

      userId = user?.id || null;
      customerId = user?.stripe_customer_id || undefined;
    }

    const stripe = getStripe();

    // Generate redemption code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let redemptionCode = 'GIFT-';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        redemptionCode += chars[Math.floor(Math.random() * chars.length)];
      }
      if (i < 2) redemptionCode += '-';
    }

    // Format tier name for display
    const tierNames: Record<string, string> = {
      dream_weaver: 'Dream Weaver',
      magic_circle: 'Magic Circle',
      enchanted_library: 'Enchanted Library',
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : purchaserEmail,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pkg.currency || 'usd',
            product_data: {
              name: `Gift: ${pkg.name}`,
              description: `${pkg.duration_months} months of ${tierNames[pkg.tier] || pkg.tier} subscription`,
              metadata: {
                type: 'gift_subscription',
                packageId: pkg.id,
              },
            },
            unit_amount: pkg.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/gifts/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/gifts`,
      metadata: {
        type: 'gift_purchase',
        packageId: pkg.id,
        packageName: pkg.name,
        tier: pkg.tier,
        durationMonths: pkg.duration_months.toString(),
        purchaserUserId: userId || '',
        purchaserEmail,
        purchaserName: purchaserName || '',
        recipientEmail: recipientEmail || '',
        recipientName: recipientName || '',
        giftMessage: giftMessage || '',
        deliveryDate: deliveryDate || '',
        redemptionCode,
      },
    });

    // Create pending gift record (cast to any until migration runs)
    await (supabaseAdmin as any).from('gift_subscriptions').insert({
      purchaser_user_id: userId,
      purchaser_email: purchaserEmail,
      purchaser_name: purchaserName || null,
      gift_package_id: pkg.id,
      tier: pkg.tier,
      duration_months: pkg.duration_months,
      price_paid_cents: pkg.price_cents,
      currency: pkg.currency || 'usd',
      redemption_code: redemptionCode,
      status: 'pending',
      recipient_email: recipientEmail || null,
      recipient_name: recipientName || null,
      gift_message: giftMessage || null,
      delivery_date: deliveryDate || null,
      stripe_checkout_session_id: session.id,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    captureError(error as Error, { action: 'create_gift_checkout' });
    console.error('Gift checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create gift checkout' },
      { status: 500 }
    );
  }
}
