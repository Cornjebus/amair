import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createStoryOrchestrator, StoryGenerationOptions } from '@/lib/story/orchestrator'
import { supabaseAdmin } from '@/lib/supabase/server'
import { CreditService } from '@/lib/credits/credit-service'
import { z } from 'zod'

// =============================================================================
// Request Validation Schema (subset of generation options)
// =============================================================================

const costPreviewSchema = z.object({
  duration: z.enum(['short', 'medium', 'long']),
  includeIllustrations: z.boolean().default(false),
  illustrationQuality: z.enum(['standard', 'hd']).optional(),
  includeNarration: z.boolean().default(false),
  voiceProvider: z.enum(['elevenlabs', 'web']).optional(),
})

// =============================================================================
// POST /api/stories/cost - Preview story generation cost
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

    // Parse request body
    const body = await request.json()
    const validationResult = costPreviewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const options = validationResult.data

    // Build full options for cost calculation
    const fullOptions: StoryGenerationOptions = {
      childId: '00000000-0000-0000-0000-000000000000', // Dummy for cost calc
      childName: 'Child',
      childAge: 5,
      theme: 'adventure',
      mood: 'bedtime-calm',
      duration: options.duration,
      includeIllustrations: options.includeIllustrations,
      illustrationQuality: options.illustrationQuality,
      includeNarration: options.includeNarration,
      voiceProvider: options.voiceProvider,
    }

    // Calculate cost
    const orchestrator = createStoryOrchestrator(supabaseAdmin, clerkId)
    const cost = orchestrator.calculateCost(fullOptions)

    // Get user's current balance
    let balance = 0
    try {
      // Get user from Clerk ID
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single()

      if (user) {
        const creditService = new CreditService(supabaseAdmin)
        balance = await creditService.getBalance(user.id)
      }
    } catch {
      // User may not have an account yet
    }

    return NextResponse.json({
      cost: {
        story: cost.story,
        illustrations: cost.illustrations,
        narration: cost.narration,
        total: cost.total,
        breakdown: cost.breakdown,
      },
      balance,
      canAfford: balance >= cost.total,
      creditsNeeded: Math.max(0, cost.total - balance),
    })
  } catch (error) {
    console.error('Cost preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate cost' },
      { status: 500 }
    )
  }
}
