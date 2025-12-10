import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { isVoicePremium, getVoiceById, getDefaultVoice } from '@/lib/elevenlabs/client';
import { getUserSubscription } from '@/lib/subscription/manager';
import { TIER_CONFIG } from '@/lib/subscription/tiers';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// =============================================================================
// POST /api/generate-audio - Start async audio generation
// =============================================================================
export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(clerkUserId, 'audioGeneration');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, 'Too many audio generation requests. Please wait a moment.');
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
    const { storyId, voiceId } = body;

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Verify story belongs to user
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, title, user_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to generate audio for this story' }, { status: 403 });
    }

    // Check if audio already exists for this story
    const { data: existingAudio } = await (supabaseAdmin as any)
      .from('story_audio')
      .select('id, public_url')
      .eq('story_id', storyId)
      .single();

    if (existingAudio) {
      return NextResponse.json({
        error: 'Audio already exists for this story',
        audioUrl: existingAudio.public_url,
      }, { status: 409 });
    }

    // Determine if voice is premium
    const selectedVoice = voiceId ? getVoiceById(voiceId) : getDefaultVoice();
    const isPremiumVoice = selectedVoice?.isPremium || false;

    // If premium voice, check user's subscription limits
    if (isPremiumVoice) {
      const { data: subscription } = await (supabaseAdmin as any)
        .from('user_subscriptions')
        .select('tier, premium_voices_used')
        .eq('user_id', user.id)
        .single();

      if (!subscription) {
        return NextResponse.json({
          error: 'Premium voices require a subscription',
          upgrade: true,
        }, { status: 403 });
      }

      const tierLimits = TIER_CONFIG[subscription.tier as keyof typeof TIER_CONFIG];
      const premiumLimit = tierLimits?.monthly_premium_voices || 0;

      if (subscription.premium_voices_used >= premiumLimit) {
        return NextResponse.json({
          error: 'Premium voice limit reached for this month',
          used: subscription.premium_voices_used,
          limit: premiumLimit,
          upgrade: true,
        }, { status: 403 });
      }
    }

    // Create a job record
    const { data: job, error: jobError } = await (supabaseAdmin as any)
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        job_type: 'audio',
        status: 'pending',
        progress: 0,
        message: 'Starting audio generation...',
        params: { storyId, voiceId, isPremiumVoice },
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Send event to Inngest
    console.log('[generate-audio] Sending event to Inngest for job:', job.id);
    try {
      await inngest.send({
        name: 'audio/generate.requested',
        data: {
          jobId: job.id,
          storyId,
          userId: user.id,
          voiceId: voiceId || getDefaultVoice().id,
          isPremiumVoice,
        },
      });
    } catch (inngestError: any) {
      console.error('[generate-audio] Inngest send error:', inngestError);
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Audio generation started',
      voiceName: selectedVoice?.name || 'Default',
      isPremiumVoice,
    });
  } catch (err: any) {
    console.error('Error starting audio generation:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to start audio generation' },
      { status: 500 }
    );
  }
}
