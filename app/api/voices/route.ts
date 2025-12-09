import { NextResponse } from 'next/server';
import { getAllVoices, STORY_VOICES } from '@/lib/elevenlabs/client';

// =============================================================================
// GET /api/voices - Get available narration voices
// =============================================================================
export async function GET() {
  try {
    const allVoices = getAllVoices();

    return NextResponse.json({
      voices: allVoices,
      categories: {
        free: STORY_VOICES.free,
        premium: STORY_VOICES.premium,
      },
    });
  } catch (err: any) {
    console.error('Error fetching voices:', err);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
