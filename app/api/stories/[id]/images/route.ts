import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// =============================================================================
// GET /api/stories/[id]/images - Get images for a story
// =============================================================================
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storyId = params.id;

    // Fetch images for the story
    const { data: images, error } = await (supabaseAdmin as any)
      .from('story_images')
      .select('id, scene_number, scene_description, public_url, style, created_at')
      .eq('story_id', storyId)
      .order('scene_number', { ascending: true });

    if (error) {
      console.error('Error fetching story images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images: images || [] });
  } catch (err: any) {
    console.error('Error in story images API:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
