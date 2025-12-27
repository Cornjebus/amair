import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'
import { createStoryOrchestrator, StoryGenerationOptions } from '@/lib/story/orchestrator'
// Note: currentUser and syncUserToSupabase are still used in POST for story creation
import { InsufficientCreditsError } from '@/lib/credits/credit-service'
import { captureError } from '@/lib/monitoring/sentry'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { z } from 'zod'

// =============================================================================
// Request Validation Schema
// =============================================================================

const generateStorySchema = z.object({
  childId: z.string().uuid(),
  childName: z.string().min(1).max(50),
  childAge: z.number().int().min(1).max(12),
  theme: z.string().min(1).max(100),
  mood: z.enum(['bedtime-calm', 'funny', 'adventure', 'mystery']),
  duration: z.enum(['short', 'medium', 'long']),
  customElements: z.array(z.string()).optional(),
  characterDescription: z.string().max(500).optional(),
  includeIllustrations: z.boolean().default(false),
  illustrationStyle: z.string().optional(),
  illustrationQuality: z.enum(['standard', 'hd']).optional(),
  includeNarration: z.boolean().default(false),
  voiceId: z.string().optional(),
  voiceProvider: z.enum(['elevenlabs', 'web']).optional(),
})

// =============================================================================
// GET /api/stories - List user's stories
// =============================================================================

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user directly from Supabase (sync is done by /api/sync-user)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's stories
    const { data: stories, error } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching stories:', error)
      throw error
    }

    return NextResponse.json({ stories })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/stories - Generate a new story
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit story generation (expensive operation)
    const rateLimitResult = await checkRateLimit(clerkId, 'storyGeneration')
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult, 'Rate limit exceeded. Please wait before generating another story.')
    }

    // Get Clerk user details
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Sync user to Supabase
    const user = await syncUserToSupabase(
      clerkId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    )

    // Parse and validate request body
    const body = await request.json()
    const validationResult = generateStorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const options: StoryGenerationOptions = validationResult.data

    // Verify child belongs to user
    const { data: child, error: childError } = await supabaseAdmin
      .from('children')
      .select('id, name')
      .eq('id', options.childId)
      .eq('user_id', user.id)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Child not found or does not belong to user' },
        { status: 404 }
      )
    }

    // Create orchestrator and calculate cost
    const orchestrator = createStoryOrchestrator(supabaseAdmin, user.id)
    const cost = orchestrator.calculateCost(options)

    // Generate the story
    const story = await orchestrator.generateStory(user.id, options)

    return NextResponse.json({
      success: true,
      story: {
        id: story.id,
        title: story.title,
        pages: story.pages,
        audioUrl: story.audioUrl,
        audioDuration: story.audioDuration,
      },
      credits: {
        used: story.totalCreditsUsed,
        breakdown: cost.breakdown,
      },
      generationTime: story.generationTime,
      providers: story.providers,
    })
  } catch (error) {
    // Handle insufficient credits
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: parseInt(error.message.match(/Required: (\d+)/)?.[1] || '0'),
          available: parseInt(error.message.match(/Available: (\d+)/)?.[1] || '0'),
        },
        { status: 402 }
      )
    }

    captureError(error as Error, { action: 'generate_story' })
    console.error('Story generation error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate story' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/stories/cost - Preview cost without generating
// =============================================================================

export async function OPTIONS(request: NextRequest) {
  // Return CORS headers for preflight
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
