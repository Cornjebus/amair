import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'
import { getUserSubscription } from '@/lib/subscription/manager'
import { canGenerateStory, trackStoryGeneration, getCurrentUsage } from '@/lib/subscription/usage'
import { hashStoryRequest, checkSuspiciousPattern } from '@/lib/rate-limit'
import { extractStoryMemory, buildUniverseContext } from '@/lib/universe/context-builder'
import { filterInputContent, getBlockedContentMessage } from '@/lib/security/content-filter'
import { moderateStoryContent, requiresRegeneration, getModerationMessage } from '@/lib/security/output-moderator'
import { scoreStoryQuality } from '@/lib/quality/story-scorer'
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
  universeContext?: string
}): string {
  const { storyRequest, tone, ageGroup, length, style, universeContext } = params

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

  return `You are a master bedtime storyteller. Your task is to write a personalized, calming bedtime story based on the parent's specific request.

## CRITICAL INSTRUCTION - PERSONALIZATION IS MANDATORY
The parent has provided a specific story request. You MUST use the EXACT names, characters, relationships, and details they mentioned. This is the most important part of your job.

**PARENT'S STORY REQUEST:**
"${storyRequest}"
${universeContext ? `\n## FAMILY UNIVERSE CONTEXT:\n\n${universeContext}\n\n**IMPORTANT:** The above characters and memories are from this family's story universe. If relevant to the parent's request, weave them naturally into the story. These characters have depth and history - use them authentically.\n` : ''}
## STORY SETTINGS (Apply these to enhance the story):

**TONE:** ${tone}
${toneGuidance[tone] || toneGuidance['bedtime-calm']}

**AGE GROUP:** ${ageGroup} years old
${ageGuidance[ageGroup] || ageGuidance['5-7']}

**LENGTH:** ${length}
${lengthGuidance[length] || lengthGuidance['medium']}

**STYLE:** ${style}
${styleGuidance[style] || styleGuidance['classic']}

## ABSOLUTE CONTENT RULES (NEVER VIOLATE):

You are writing bedtime stories for children. Safety is paramount.

**NEVER include:**
- Violence, death, injury, fighting, or weapons of any kind
- Scary content - no monsters attacking, children being lost or in danger, nightmares
- Adult themes, romance, or anything inappropriate for children
- References to drugs, alcohol, smoking, or harmful substances
- Bullying, meanness, or characters being cruel to each other
- Anything that could give a child nightmares or make them scared to sleep

**ALWAYS ensure:**
- The story feels safe, warm, and comforting
- Characters are kind to each other
- Any "adventure" has gentle stakes (finding a lost toy, not escaping danger)
- The ending is peaceful and satisfying
- A parent would feel good reading this to their child at bedtime

**If the user's request contains inappropriate elements:**
Transform them into safe alternatives. "Dinosaur battle" becomes "dinosaur dance party". "Monster" becomes "friendly creature". "Fighting" becomes "playing" or "racing".

## YOUR TASK:

**Think like a master storyteller.** The parent's request is raw material - your job is to understand their INTENT and transform it into beautiful, flowing prose that a professional children's author would write.

### 1. NAMES ARE SACRED
Use every name exactly as provided. If they mention "Amari", "Cornelius", "Luna", "Max" - those exact names must appear.

### 2. INTERPRET, DON'T TRANSCRIBE
The parent writes casually; you write artfully. Understand what they MEAN, not just what they SAY:
- "my daughter" → She's a girl. Write "a clever girl", "a curious child", "a bright-eyed dreamer"
- "likes dinosaurs" → Weave dinosaurs into the story naturally, don't just list them
- "lives by the ocean" → Paint the setting with sensory details - salt air, crashing waves, sandy toes
- "her mom Tara" → Tara is her mother - introduce her warmly as characters naturally would

Never use awkward literal translations. "Little daughter" sounds robotic. "A spirited young girl" sounds like a real book.

### 3. WRITE WITH CRAFT
Great children's stories have:
- **Rhythm and flow** - Sentences that beg to be read aloud
- **Sensory details** - What do characters see, hear, smell, feel?
- **Emotional truth** - Capture the feelings, not just the facts
- **Natural dialogue** - Characters speak like real people
- **Show, don't tell** - "Her eyes widened with wonder" not "She was amazed"

### 4. INCLUDE THEIR ELEMENTS
Whatever specific things they mention (magic gardens, dragons, treasure hunts, favorite toys) - weave them into your story with purpose and delight.

### 5. THE FINAL TEST
Read your story aloud in your mind. Does it flow like a beloved bedtime book? Would a child lean in closer to hear what happens next? Would a parent enjoy reading it? If not, revise until it does.

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
// Extract character names from story request using regex
// =============================================================================

function extractCharacterNames(text: string): string[] {
  const names: string[] = []

  // Split into sentences to avoid capitalized words at sentence start
  const sentences = text.split(/[.!?]+/)

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/)

    // Skip first word of each sentence (likely capitalized for grammar)
    for (let i = 1; i < words.length; i++) {
      const word = words[i]

      // Match capitalized words that look like names (2+ chars, no special chars)
      if (/^[A-Z][a-z]{1,}$/.test(word)) {
        // Filter out common words that are capitalized
        const commonWords = ['The', 'And', 'But', 'When', 'Where', 'What', 'Who', 'How', 'Why', 'Then', 'Now', 'Once']
        if (!commonWords.includes(word) && !names.includes(word)) {
          names.push(word)
        }
      }
    }
  }

  return names
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

    // Check input content safety BEFORE processing
    const inputFilter = filterInputContent(storyRequest)
    if (inputFilter.blocked) {
      console.warn('[generate-story] Input blocked:', inputFilter.category, 'for user:', user.id)
      return NextResponse.json(
        {
          error: getBlockedContentMessage(inputFilter),
          category: inputFilter.category,
        },
        { status: 400 }
      )
    }

    // Use sanitized text if available
    const safeStoryRequest = inputFilter.sanitizedText || storyRequest

    // Check for suspicious patterns (identical requests repeated quickly)
    const requestHash = hashStoryRequest({ storyRequest: safeStoryRequest, tone, ageGroup, length, style })
    const isSuspicious = await checkSuspiciousPattern(user.id, requestHash)

    if (isSuspicious) {
      console.warn('[generate-story] Suspicious pattern detected for user:', user.id)
      return NextResponse.json(
        {
          error: 'Please wait a moment before requesting the same story again.',
          retryAfter: 60,
        },
        { status: 429 }
      )
    }

    // Map legacy length values to database enum (quick/medium/epic)
    type StoryLength = 'quick' | 'medium' | 'epic'
    const lengthMap: Record<string, StoryLength> = {
      'short': 'quick',
      'long': 'epic',
      'quick': 'quick',
      'medium': 'medium',
      'epic': 'epic',
    }
    const dbLength: StoryLength = lengthMap[length] || 'medium'

    // Build universe context if available
    const universeContext = await buildUniverseContext(user.id)
    const universePrompt = universeContext?.contextPrompt || undefined

    console.log('[generate-story] Universe context available:', !!universePrompt)

    // Build the robust prompt
    const prompt = buildStoryPrompt({
      storyRequest: storyRequest.trim(),
      tone,
      ageGroup,
      length,
      style,
      universeContext: universePrompt,
    })

    console.log('[generate-story] Calling OpenAI with user request:', storyRequest.substring(0, 100))

    // Try GPT-5 mini first, fallback to GPT-4o if unavailable
    let responseText: string | null = null
    let modelUsed = 'gpt-5-mini'

    try {
      // GPT-5 mini needs extra tokens for reasoning (uses ~20-30% for internal reasoning)
      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 8000, // Extra tokens for reasoning models
      })
      responseText = completion.choices[0]?.message?.content

      if (!responseText || responseText.trim().length < 50) {
        throw new Error('GPT-5 mini returned empty or too short response')
      }
      console.log('[generate-story] GPT-5 mini response received, length:', responseText.length)
    } catch (gpt5Error: any) {
      console.error('[generate-story] GPT-5 mini failed, trying GPT-4o:', gpt5Error.message)
      modelUsed = 'gpt-4o'

      // Fallback to GPT-4o
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.8,
      })
      responseText = completion.choices[0]?.message?.content
      console.log('[generate-story] GPT-4o response received, length:', responseText?.length || 0)
    }

    if (!responseText) {
      throw new Error('No response from AI model')
    }

    // Parse title and content
    const { title, content } = parseStoryResponse(responseText)
    const wordCount = content.split(/\s+/).length

    console.log('[generate-story] Story generated:', title, `(${wordCount} words)`)

    // Check output content safety AFTER generation
    const outputModeration = await moderateStoryContent(content)
    if (outputModeration.flagged && requiresRegeneration(outputModeration)) {
      console.warn('[generate-story] Output flagged by moderation:', outputModeration.categories)
      // For now, log and continue - in production, could regenerate with stricter prompt
      // This helps us monitor without blocking users
    }

    // Score story quality
    const qualityScore = scoreStoryQuality(content, {
      storyRequest: safeStoryRequest,
      ageGroup,
      targetLength: dbLength,
    })

    console.log('[generate-story] Quality score:', qualityScore.total, qualityScore.passed ? 'PASSED' : 'NEEDS IMPROVEMENT')

    // Save to database with quality score
    const { data: story, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        content,
        tone,
        length: dbLength,
        word_count: wordCount,
        quality_score: qualityScore.total,
        ai_provider: 'openai',
        ai_model: modelUsed,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[generate-story] Database error:', dbError)
      throw new Error('Failed to save story')
    }

    // Extract and save story memory for future context (non-blocking)
    try {
      const characterNames = extractCharacterNames(storyRequest)
      await extractStoryMemory(user.id, story.id, content, [])

      console.log('[generate-story] Memory extraction completed', {
        storyId: story.id,
        characters: characterNames,
      })
    } catch (memoryError: any) {
      // Don't fail the request if memory extraction fails
      console.error('[generate-story] Memory extraction failed:', memoryError.message)
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

    // Ensure we always return valid JSON, never HTML
    const errorMessage = err.message || 'Failed to generate story'
    const isOpenAIError = errorMessage.includes('OpenAI') || errorMessage.includes('API') || err.status

    return NextResponse.json(
      {
        error: isOpenAIError
          ? 'Our story service is temporarily busy. Please try again in a moment.'
          : errorMessage,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    )
  }
}
