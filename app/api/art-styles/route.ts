import { NextRequest, NextResponse } from 'next/server';
import { ART_STYLES } from '@/lib/ai/art-styles';
import { checkRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';

// =============================================================================
// GET /api/art-styles - Get available illustration styles
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP for public endpoint
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'apiGeneral');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const styles = Object.entries(ART_STYLES).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    return NextResponse.json({ styles });
  } catch (err) {
    logger.error('Error fetching art styles', err);
    return NextResponse.json(
      { error: 'Failed to fetch art styles' },
      { status: 500 }
    );
  }
}
