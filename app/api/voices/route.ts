import { NextRequest, NextResponse } from 'next/server';
import { getAllVoices, STORY_VOICES } from '@/lib/elevenlabs/client';
import { checkRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logging';

// =============================================================================
// GET /api/voices - Get available narration voices
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP for public endpoint
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(clientIP, 'apiGeneral');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit);
    }

    const allVoices = getAllVoices();

    return NextResponse.json({
      voices: allVoices,
      categories: {
        free: STORY_VOICES.free,
        premium: STORY_VOICES.premium,
      },
    });
  } catch (err) {
    logger.error('Error fetching voices', err);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
