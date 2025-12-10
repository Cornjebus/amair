import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { syncUserToSupabase } from '@/lib/supabase/sync-user';
import { getUserSubscription } from '@/lib/subscription/manager';
import { canGenerateStory, getCurrentUsage } from '@/lib/subscription/usage';
import { inngest } from '@/lib/inngest/client';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

interface ChildData {
  name: string;
  gender: 'boy' | 'girl' | 'other';
  itemCount: number;
  items: string[];
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery';
  length: 'quick' | 'medium' | 'epic';
}

// =============================================================================
// POST /api/generate-story-async - Start async story generation
// =============================================================================
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(userId, 'storyGeneration');
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit, 'Too many story generation requests. Please wait a moment.');
    }

    // Get Clerk user details
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    // Sync user to Supabase
    const user = await syncUserToSupabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    );

    // Get user's subscription details
    const subscription = await getUserSubscription(user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: 'Unable to retrieve subscription details' },
        { status: 500 }
      );
    }

    // Check if user can generate a story
    const usePremiumVoice = false;
    const canGenerate = await canGenerateStory(user.id, subscription.tier, usePremiumVoice);

    if (!canGenerate.allowed) {
      const periodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : undefined;
      const usage = await getCurrentUsage(user.id, periodStart);

      return NextResponse.json(
        {
          error: canGenerate.reason,
          usage: {
            stories_generated: usage.stories_generated,
            stories_limit: canGenerate.storyCheck.limit,
            billing_period_end: usage.billing_period_end,
          },
          upgrade: {
            message: 'Upgrade to create more stories',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { children, config }: { children: ChildData[]; config: StoryConfig } = body;

    // Validate input
    if (!children || children.length === 0) {
      return NextResponse.json({ error: 'At least one child is required' }, { status: 400 });
    }

    if (!config?.tone || !config?.length) {
      return NextResponse.json({ error: 'Story configuration is required' }, { status: 400 });
    }

    // Create a job record in the database
    const { data: job, error: jobError } = await (supabaseAdmin as any)
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        job_type: 'story',
        status: 'pending',
        progress: 0,
        message: 'Starting story generation...',
        params: { children, config },
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Send event to Inngest to start background processing
    console.log('[generate-story-async] Sending event to Inngest for job:', job.id);
    try {
      const sendResult = await inngest.send({
        name: 'story/generate.requested',
        data: {
          jobId: job.id,
          userId: user.id,
          storyParams: { children, config },
        },
      });
      console.log('[generate-story-async] Inngest send result:', sendResult);
    } catch (inngestError: any) {
      console.error('[generate-story-async] Inngest send error:', inngestError);
      // Don't fail the request - the job is created, user can retry
    }

    // Return job ID immediately
    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Story generation started',
    });
  } catch (err: any) {
    console.error('Error starting async story generation:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to start story generation' },
      { status: 500 }
    );
  }
}
