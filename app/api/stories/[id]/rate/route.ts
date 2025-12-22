import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { syncUserToSupabase } from '@/lib/supabase/sync-user';

interface RateStoryRequest {
  rating: number; // 1-5 stars
  feedback?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Clerk user details
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      );
    }

    // Sync user to Supabase
    const user = await syncUserToSupabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    );

    // Parse and validate request body
    const body: RateStoryRequest = await request.json();

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate rating is an integer
    if (!Number.isInteger(body.rating)) {
      return NextResponse.json(
        { error: 'Rating must be a whole number' },
        { status: 400 }
      );
    }

    // Verify story exists and belongs to user
    const { data: existingStory, error: fetchError } = await supabaseAdmin
      .from('stories')
      .select('id, rating')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if story has already been rated
    if (existingStory.rating !== null) {
      return NextResponse.json(
        { error: 'Story has already been rated' },
        { status: 400 }
      );
    }

    // Update story with rating and feedback
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from('stories')
      .update({
        rating: body.rating,
        feedback: body.feedback || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating story rating:', updateError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      story: updatedStory,
    });
  } catch (error: any) {
    console.error('Error rating story:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rate story' },
      { status: 500 }
    );
  }
}
