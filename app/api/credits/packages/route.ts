import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { captureError } from '@/lib/monitoring/sentry';
import { checkRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';

// =============================================================================
// GET /api/credits/packages - Get available credit packages
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP for public endpoint
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'apiGeneral');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const { data: packages, error } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform to frontend-friendly format
    const formattedPackages = (packages || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      credits: pkg.credits,
      bonusCredits: pkg.bonus_credits || 0,
      totalCredits: pkg.credits + (pkg.bonus_credits || 0),
      price: pkg.price_cents / 100, // Convert cents to dollars
      priceCents: pkg.price_cents,
      currency: pkg.currency || 'USD',
      stripePriceId: pkg.stripe_price_id,
      isFeatured: pkg.is_featured || false,
      pricePerCredit: (pkg.price_cents / 100 / (pkg.credits + (pkg.bonus_credits || 0))).toFixed(3),
    }));

    return NextResponse.json({
      packages: formattedPackages,
    });
  } catch (error) {
    logger.error('Error fetching credit packages', error);
    captureError(error as Error, { action: 'get_credit_packages' });
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}
