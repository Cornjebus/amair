import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { captureError } from '@/lib/monitoring/sentry';
import { checkRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';

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

    // Cast to any to bypass strict type checking until migration runs
    const { data: packages, error } = await (supabaseAdmin as any)
      .from('gift_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }) as { data: GiftPackage[] | null; error: any };

    if (error) {
      throw error;
    }

    // Group by tier for easier frontend consumption
    const grouped: Record<string, GiftPackage[]> = {
      dream_weaver: [],
      magic_circle: [],
      enchanted_library: [],
    };

    for (const pkg of packages || []) {
      if (grouped[pkg.tier]) {
        grouped[pkg.tier].push(pkg);
      }
    }

    return NextResponse.json({
      packages: packages || [],
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
