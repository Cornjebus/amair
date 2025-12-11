import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'
import { getUserSubscription } from '@/lib/subscription/manager'
import { canGenerateStory, trackStoryGeneration, getCurrentUsage } from '@/lib/subscription/usage'
import { getAIService } from '@/lib/ai'
import { captureError } from '@/lib/monitoring/sentry'
import {
  buildUniverseContext,
  extractStoryMemory,
  linkCharactersToStory,
} from '@/lib/universe/context-builder'

interface ChildData {
  name: string
  gender: 'boy' | 'girl' | 'other'
  itemCount: number
  items: string[]
  characterId?: string // Optional: link to existing character
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
  characterIds?: string[] // Optional: use existing characters
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Clerk user details
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      )
    }

    // Sync user to Supabase (creates if doesn't exist)
    const user = await syncUserToSupabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    )

    // Get user's subscription details
    const subscription = await getUserSubscription(user.id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Unable to retrieve subscription details' },
        { status: 500 }
      )
    }

    // Check if user can generate a story (usage limits)
    const usePremiumVoice = false // TODO: Get from request body when voice feature is added
    const canGenerate = await canGenerateStory(user.id, subscription.tier, usePremiumVoice)

    if (!canGenerate.allowed) {
      // Get current usage to send to client
      const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : undefined
      const usage = await getCurrentUsage(user.id, periodStart)

      return NextResponse.json(
        {
          error: canGenerate.reason,
          usage: {
            stories_generated: usage.stories_generated,
            stories_limit: canGenerate.storyCheck.limit,
            premium_voices_used: usage.premium_voices_used,
            billing_period_end: usage.billing_period_end,
          },
          upgrade: {
            message: 'Upgrade to create more stories',
          }
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { children, config }: { children: ChildData[]; config: StoryConfig } = body

    // Map config.length to duration for AI service
    const durationMap: Record<string, 'short' | 'medium' | 'long'> = {
      quick: 'short',
      medium: 'medium',
      epic: 'long',
    }
    const duration = durationMap[config.length] || 'medium'

    // Map tone to mood/theme
    const moodMap: Record<string, string> = {
      'bedtime-calm': 'calm and soothing',
      'funny': 'playful and humorous',
      'adventure': 'exciting and adventurous',
      'mystery': 'intriguing and mysterious',
    }
    const mood = moodMap[config.tone] || 'calm'

    // Get primary child info for AI service
    const primaryChild = children[0]
    const customElements = children.flatMap(c => c.items)

    // Build character description for illustrations
    const characterDescription = children
      .map(c => `${c.name} (${c.gender === 'girl' ? 'girl' : c.gender === 'boy' ? 'boy' : 'child'})`)
      .join(', ')

    // Get character IDs from children or config
    const characterIds = config.characterIds || children.map(c => c.characterId).filter(Boolean) as string[]

    // Build universe context for AI (character memories, previous stories)
    const universeContext = await buildUniverseContext(user.id, characterIds)

    // Initialize AI service with user context for tracking
    const aiService = getAIService({
      userId: user.id,
      preferredStoryProvider: 'anthropic', // Claude as primary
      enableFallback: true,
      trackUsage: true,
    })

    // Generate story using multi-provider AI service
    let storyResponse
    try {
      storyResponse = await aiService.generateStory({
        childName: primaryChild.name,
        childAge: 6, // Default age for now
        theme: config.tone,
        mood,
        duration,
        customElements,
        characterDescription,
        // Add universe context if available
        ...(universeContext?.contextPrompt && {
          universeContext: universeContext.contextPrompt,
        }),
      })
    } catch (aiError) {
      captureError(aiError as Error, {
        userId: user.id,
        action: 'ai_story_generation',
        metadata: { config, childrenCount: children.length },
      })
      throw aiError
    }

    // Extract title and content from AI response
    const title = storyResponse.title
    const content = storyResponse.content
    const wordCount = content.split(/\s+/).length

    // Save story to database with AI provider info
    const { data: story, error } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        content,
        tone: config.tone,
        length: config.length,
        word_count: wordCount,
        ai_provider: storyResponse.provider,
        ai_model: storyResponse.model,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving story:', error)
      throw error
    }

    // Save story seeds
    for (const child of children) {
      await supabaseAdmin.from('story_seeds').insert({
        story_id: story.id,
        child_name: child.name,
        seed_items: child.items,
      })
    }

    // Link characters to story and extract memory (non-blocking)
    if (characterIds.length > 0) {
      linkCharactersToStory(story.id, characterIds).catch(console.error)
    }
    extractStoryMemory(user.id, story.id, content, characterIds).catch(console.error)

    // Track story generation for usage limits
    await trackStoryGeneration(user.id, { usedPremiumVoice: usePremiumVoice })

    // Get updated usage to return to client
    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : undefined
    const updatedUsage = await getCurrentUsage(user.id, periodStart)

    return NextResponse.json({
      story: {
        id: story.id,
        title,
        content,
        wordCount,
      },
      usage: {
        stories_generated: updatedUsage.stories_generated,
        stories_remaining: canGenerate.storyCheck.limit - updatedUsage.stories_generated,
        billing_period_end: updatedUsage.billing_period_end,
        tier: subscription.tier,
      },
    })
  } catch (err: any) {
    console.error('Error generating story:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate story' },
      { status: 500 }
    )
  }
}
