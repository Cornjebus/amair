import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { ART_STYLES, ArtStyle } from '@/lib/ai/image-generator';

// =============================================================================
// POST /api/generate-images - Start async image generation
// =============================================================================
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { storyId, style, count } = body;

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Validate style
    const artStyle: ArtStyle = style && ART_STYLES[style as ArtStyle] ? style : 'watercolor';
    const imageCount = Math.min(Math.max(count || 3, 1), 5); // 1-5 images

    // Verify story belongs to user
    const { data: story, error: storyError } = await (supabaseAdmin as any)
      .from('stories')
      .select('id, title, user_id, has_illustrations')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to generate images for this story' }, { status: 403 });
    }

    // Check if images already exist
    if (story.has_illustrations) {
      const { data: existingImages } = await (supabaseAdmin as any)
        .from('story_images')
        .select('id, public_url, scene_number')
        .eq('story_id', storyId)
        .order('scene_number', { ascending: true });

      return NextResponse.json({
        error: 'Illustrations already exist for this story',
        images: existingImages || [],
      }, { status: 409 });
    }

    // Create a job record
    const { data: job, error: jobError } = await (supabaseAdmin as any)
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        job_type: 'images',
        status: 'pending',
        progress: 0,
        message: 'Starting illustration generation...',
        params: { storyId, style: artStyle, count: imageCount },
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Send event to Inngest
    console.log('[generate-images] Sending event to Inngest for job:', job.id);
    try {
      await inngest.send({
        name: 'images/generate.requested',
        data: {
          jobId: job.id,
          storyId,
          userId: user.id,
          style: artStyle,
          count: imageCount,
        },
      });
    } catch (inngestError: any) {
      console.error('[generate-images] Inngest send error:', inngestError);
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Illustration generation started',
      style: artStyle,
      count: imageCount,
    });
  } catch (err: any) {
    console.error('Error starting image generation:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to start image generation' },
      { status: 500 }
    );
  }
}
