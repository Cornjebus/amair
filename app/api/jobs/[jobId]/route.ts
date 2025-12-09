import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// =============================================================================
// GET /api/jobs/[jobId] - Get job status
// =============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    // Get user ID from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get job (ensuring it belongs to the user)
    const { data: job, error: jobError } = await (supabaseAdmin as any)
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // If job is completed and has a result, fetch the story details
    let story = null;
    if (job.status === 'completed' && job.result_id && job.job_type === 'story') {
      const { data: storyData } = await supabaseAdmin
        .from('stories')
        .select('id, title, content, word_count, tone, length, created_at')
        .eq('id', job.result_id)
        .single();

      story = storyData;
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      jobType: job.job_type,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      errorMessage: job.error_message,
      story,
    });
  } catch (err: any) {
    console.error('Error fetching job status:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
