import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// =============================================================================
// GET /api/jobs - List user's recent jobs
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, generating, completed, failed
    const jobType = searchParams.get('type'); // story, audio, images, video
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build query
    let query = (supabaseAdmin as any)
      .from('generation_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (jobType) {
      query = query.eq('job_type', jobType);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Check for any active jobs (pending or generating)
    const activeJobs = jobs?.filter(
      (j: any) => j.status === 'pending' || j.status === 'generating'
    );

    return NextResponse.json({
      jobs: jobs || [],
      hasActiveJobs: activeJobs && activeJobs.length > 0,
      activeJobCount: activeJobs?.length || 0,
    });
  } catch (err: any) {
    console.error('Error fetching jobs:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
