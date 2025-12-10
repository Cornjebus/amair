import { NextResponse } from 'next/server';
import { ART_STYLES } from '@/lib/ai/art-styles';

// =============================================================================
// GET /api/art-styles - Get available illustration styles
// =============================================================================
export async function GET() {
  try {
    const styles = Object.entries(ART_STYLES).map(([key, value]) => ({
      id: key,
      ...value,
    }));

    return NextResponse.json({ styles });
  } catch (err: any) {
    console.error('Error fetching art styles:', err);
    return NextResponse.json(
      { error: 'Failed to fetch art styles' },
      { status: 500 }
    );
  }
}
