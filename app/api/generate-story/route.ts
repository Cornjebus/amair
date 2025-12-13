import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'
import { getUserSubscription } from '@/lib/subscription/manager'
import { canGenerateStory, trackStoryGeneration, getCurrentUsage } from '@/lib/subscription/usage'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// =============================================================================
// PROMPT ENGINEERING - Robust story generation prompt
// =============================================================================

function buildStoryPrompt(params: {
  storyRequest: string
  tone: string
  ageGroup: string
  length: string
  style: string
}): string {
  const { storyRequest, tone, ageGroup, length, style } = params

  // Map tone to writing guidance
  const toneGuidance: Record<string, string> = {
    'bedtime-calm': 'Write in a gentle, soothing voice. Use soft imagery, calming descriptions, and a peaceful pace. The story should help a child relax and feel safe. End on a cozy, sleepy note.',
    'funny': 'Write with humor and playfulness! Include silly situations, funny dialogue, sound effects (like "SPLAT!" or "Whoooosh!"), and moments that will make children giggle. Keep the energy light and joyful.',
    'adventure': 'Write with excitement and energy! Include brave moments, interesting challenges to overcome, and a sense of wonder and discovery. Make the characters feel heroic and capable.',
    'mystery': 'Write with curiosity and intrigue! Include clues to discover, questions to solve, and "aha!" moments. Build gentle suspense appropriate for children, with a satisfying resolution.',
  }

  // Map age group to language and complexity guidance
  const ageGuidance: Record<string, string> = {
    '2-4': 'Use very simple words and short sentences. Lots of repetition is good. Focus on familiar concepts (animals, family, colors, feelings). Keep the plot straightforward with 1-2 simple events. Use onomatopoeia and rhythmic language.',
    '5-7': 'Use engaging vocabulary with some new words to learn. Sentences can be longer with more description. Include dialogue between characters. The plot can have 2-3 events with simple cause-and-effect. Add gentle lessons about friendship, kindness, or bravery.',
    '8-10': 'Use rich vocabulary and varied sentence structures. Include more complex emotions and character development. The plot can have multiple events, minor challenges, and character growth. Themes can be more sophisticated while remaining age-appropriate.',
  }

  // Map length to word count guidance
  const lengthGuidance: Record<string, string> = {
    'quick': 'Write approximately 300-400 words (2-3 minute read). Get to the heart of the story quickly.',
    'medium': 'Write approximately 600-800 words (5 minute read). Allow time for setting and character moments.',
    'epic': 'Write approximately 1000-1200 words (10 minute read). Include rich details, dialogue, and a well-developed arc.',
  }

  // Map style to narrative approach
  const styleGuidance: Record<string, string> = {
    'classic': 'Write in classic fairytale style. Begin with "Once upon a time..." and end with a satisfying conclusion. Use timeless storytelling elements and a warm, traditional narrative voice.',
    'modern': 'Write in a contemporary style. The setting should feel current and relatable. Characters can use modern expressions. The narrative voice should be fresh and engaging.',
    'fantasy': 'Write with magical and fantastical elements. Include wonder, enchantment, and imagination. Create a world where amazing things are possible. Use vivid, magical descriptions.',
    'animal': 'Feature animals as main characters who can talk and have personalities. Give them relatable emotions and adventures. The animals should be charming and expressive.',
  }

  return `You are a master children's storyteller. Your task is to write a personalized bedtime story based on the parent's specific request.

## CRITICAL INSTRUCTION - PERSONALIZATION IS MANDATORY
The parent has provided a specific story request. You MUST use the EXACT names, characters, relationships, and details they mentioned. This is the most important part of your job.

**PARENT'S STORY REQUEST:**
"${storyRequest}"

## STORY SETTINGS (Apply these to enhance the story):

**TONE:** ${tone}
${toneGuidance[tone] || toneGuidance['bedtime-calm']}

**AGE GROUP:** ${ageGroup} years old
${ageGuidance[ageGroup] || ageGuidance['5-7']}

**LENGTH:** ${length}
${lengthGuidance[length] || lengthGuidance['medium']}

**STYLE:** ${style}
${styleGuidance[style] || styleGuidance['classic']}

## YOUR TASK:

1. **Extract and USE every name mentioned** - If the parent says "Amari and her brother Cornelius", your story MUST feature characters named Amari and Cornelius as siblings.

2. **Honor the relationship details** - If they say "daughter", "son", "brother", "sister", "best friend" - use those exact relationships.

3. **Include any specific elements mentioned** - Magic gardens, dragons, treasure maps, specific pets - whatever they asked for must appear in the story.

4. **Apply the tone, age, length, and style settings** to craft how you tell the story, but NEVER change WHO the story is about.

## OUTPUT FORMAT:

Start with a creative title on its own line, then a blank line, then the story.

Example format:
The Magical Garden of Amari and Cornelius

Once upon a time, in a cozy house on Maple Street, there lived a clever girl named Amari and her adventurous brother Cornelius...

---

Now write the story. Remember: The names and characters from the parent's request are SACRED - use them exactly as provided!`
}

// =============================================================================
// Parse the AI response to extract title and content
// =============================================================================

function parseStoryResponse(text: string): { title: string; content: string } {
  const lines = text.trim().split('\n')

  // First non-empty line is the title
  let titleIndex = 0
  while (titleIndex < lines.length && !lines[titleIndex].trim()) {
    titleIndex++
  }

  const title = lines[titleIndex]?.trim() || 'A Magical Story'

  // Find the start of the actual story content (after title and blank lines)
  let contentStartIndex = titleIndex + 1
  while (contentStartIndex < lines.length && !lines[contentStartIndex].trim()) {
    contentStartIndex++
  }

  const content = lines.slice(contentStartIndex).join('\n').trim()

  return { title, content }
}

// =============================================================================
// POST /api/generate-story - Direct GPT-5 mini story generation
// =============================================================================

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Clerk user details
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sync user to Supabase
    const user = await syncUserToSupabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    )

    // Get subscription and check limits
    const subscription = await getUserSubscription(user.id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Unable to retrieve subscription details' },
        { status: 500 }
      )
    }

    const canGenerate = await canGenerateStory(user.id, subscription.tier, false)
    if (!canGenerate.allowed) {
      const periodStart = subscription.current_period_start
        ? new Date(subscription.current_period_start)
        : undefined
      const usage = await getCurrentUsage(user.id, periodStart)

      return NextResponse.json(
        {
          error: canGenerate.reason,
          usage: {
            stories_generated: usage.stories_generated,
            stories_limit: canGenerate.storyCheck.limit,
            billing_period_end: usage.billing_period_end,
          },
          upgrade: { message: 'Upgrade to create more stories' },
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { storyRequest, tone, ageGroup, length, style } = body

    // Validate required fields
    if (!storyRequest || storyRequest.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a story description (at least 10 characters)' },
        { status: 400 }
      )
    }

    if (!tone || !ageGroup || !length || !style) {
      return NextResponse.json(
        { error: 'Please select tone, age group, length, and style' },
        { status: 400 }
      )
    }

    // Build the robust prompt
    const prompt = buildStoryPrompt({
      storyRequest: storyRequest.trim(),
      tone,
      ageGroup,
      length,
      style,
    })

    console.log('[generate-story] Calling GPT-5 mini with user request:', storyRequest.substring(0, 100))

    // Call GPT-5 mini directly
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 2000,
      // Note: GPT-5 models only support default temperature (1)
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from AI model')
    }

    // Parse title and content
    const { title, content } = parseStoryResponse(responseText)
    const wordCount = content.split(/\s+/).length

    console.log('[generate-story] Story generated:', title, `(${wordCount} words)`)

    // Save to database
    const { data: story, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        content,
        tone,
        length,
        word_count: wordCount,
        ai_provider: 'openai',
        ai_model: 'gpt-5-mini',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[generate-story] Database error:', dbError)
      throw new Error('Failed to save story')
    }

    // Track usage
    await trackStoryGeneration(user.id, { usedPremiumVoice: false })

    // Get updated usage
    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start)
      : undefined
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
    console.error('[generate-story] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to generate story' },
      { status: 500 }
    )
  }
}
