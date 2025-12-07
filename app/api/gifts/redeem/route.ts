import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { captureError, captureMessage } from '@/lib/monitoring/sentry';

// Result type from redeem_gift_code RPC (not in generated types yet)
interface RedemptionResult {
  success: boolean;
  error_message?: string;
  tier?: string;
  duration_months?: number;
  new_period_end?: string;
}

// =============================================================================
// POST /api/gifts/redeem - Redeem a gift code
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Gift code is required' },
        { status: 400 }
      );
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

    // Normalize the code
    const normalizedCode = code.toUpperCase().trim();

    // Use the database function for atomic redemption (cast to any until migration runs)
    const { data, error: rpcError } = await (supabaseAdmin as any).rpc('redeem_gift_code', {
      p_user_id: user.id,
      p_redemption_code: normalizedCode,
    }) as { data: RedemptionResult[] | null; error: any };

    if (rpcError) {
      captureError(rpcError, { action: 'redeem_gift_code', metadata: { code: normalizedCode } });
      return NextResponse.json(
        { error: 'Failed to redeem gift code' },
        { status: 500 }
      );
    }

    const result = data?.[0];

    if (!result) {
      return NextResponse.json(
        { error: 'No result from redemption' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error_message || 'Failed to redeem gift code' },
        { status: 400 }
      );
    }

    captureMessage('Gift code redeemed', 'info', {
      userId: user.id,
      tier: result.tier,
      durationMonths: result.duration_months,
    });

    return NextResponse.json({
      success: true,
      tier: result.tier,
      durationMonths: result.duration_months,
      newPeriodEnd: result.new_period_end,
      message: `Successfully redeemed ${result.duration_months} months of ${formatTierName(result.tier || '')}!`,
    });
  } catch (error) {
    captureError(error as Error, { action: 'redeem_gift' });
    console.error('Gift redemption error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem gift code' },
      { status: 500 }
    );
  }
}

// Gift subscription type (not in generated types yet)
interface GiftSubscription {
  id: string;
  tier: string;
  duration_months: number;
  status: string;
  expires_at: string;
  gift_message?: string;
  purchaser_name?: string;
  gift_package?: {
    name: string;
  };
}

// =============================================================================
// GET /api/gifts/redeem?code=XXX - Validate a gift code
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Gift code is required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // Get the gift subscription (cast to any until migration runs)
    const { data: gift, error } = await (supabaseAdmin as any)
      .from('gift_subscriptions')
      .select('*, gift_package:gift_packages(*)')
      .eq('redemption_code', normalizedCode)
      .single() as { data: GiftSubscription | null; error: any };

    if (error || !gift) {
      return NextResponse.json(
        { valid: false, error: 'Invalid gift code' },
        { status: 200 }
      );
    }

    if (gift.status === 'redeemed') {
      return NextResponse.json(
        { valid: false, error: 'This gift code has already been redeemed' },
        { status: 200 }
      );
    }

    if (gift.status === 'expired' || new Date(gift.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'This gift code has expired' },
        { status: 200 }
      );
    }

    if (gift.status === 'refunded') {
      return NextResponse.json(
        { valid: false, error: 'This gift code has been refunded' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      tier: gift.tier,
      tierName: formatTierName(gift.tier),
      durationMonths: gift.duration_months,
      packageName: gift.gift_package?.name,
      message: gift.gift_message,
      fromName: gift.purchaser_name,
    });
  } catch (error) {
    captureError(error as Error, { action: 'validate_gift_code' });
    console.error('Gift validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate gift code' },
      { status: 500 }
    );
  }
}

function formatTierName(tier: string): string {
  const names: Record<string, string> = {
    dream_weaver: 'Dream Weaver',
    magic_circle: 'Magic Circle',
    enchanted_library: 'Enchanted Library',
  };
  return names[tier] || tier;
}
