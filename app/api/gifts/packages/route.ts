import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { captureError } from '@/lib/monitoring/sentry';
import { checkRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';

// =============================================================================
// GET /api/gifts/packages - Get all gift packages (public)
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP for public endpoint
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'apiGeneral');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const db = await getDatabase();

    // Get active gift packages using DAL
    const packages = await db.gifts.getPackages({ activeOnly: true });

    // Map to API response format (snake_case for backwards compatibility)
    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      tier: pkg.tier,
      duration_months: pkg.durationMonths,
      price_cents: pkg.priceCents,
      currency: pkg.currency,
      description: pkg.description,
      is_active: pkg.isActive,
      display_order: pkg.displayOrder,
    }));

    // Group by tier for easier frontend consumption
    const grouped: Record<string, typeof formattedPackages> = {
      dream_weaver: [],
      magic_circle: [],
      enchanted_library: [],
    };

    for (const pkg of formattedPackages) {
      if (grouped[pkg.tier]) {
        grouped[pkg.tier].push(pkg);
      }
    }

    return NextResponse.json({
      packages: formattedPackages,
      byTier: grouped,
    });
  } catch (error) {
    logger.error('Error fetching gift packages', error);
    captureError(error as Error, { action: 'get_gift_packages' });
    return NextResponse.json(
      { error: 'Failed to get gift packages' },
      { status: 500 }
    );
  }
}
