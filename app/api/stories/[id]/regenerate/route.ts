import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { syncUserToSupabase } from '@/lib/supabase/sync-user';
import { getUserSubscription } from '@/lib/subscription/manager';
import { canGenerateStory, trackStoryGeneration, getCurrentUsage } from '@/lib/subscription/usage';
import { scoreStoryQuality } from '@/lib/quality/story-scorer';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_REGENERATIONS = 3;

// Copy story prompt builder from generate-story route
function buildStoryPrompt(params: {
  storyRequest: string;
  tone: string;
  ageGroup: string;
  length: string;
  style: string;
}): string {
  const { storyRequest, tone, ageGroup, length, style } = params;

  const toneGuidance: Record<string, string> = {
    'bedtime-calm': 'Write in a gentle, soothing voice. Use soft imagery, calming descriptions, and a peaceful pace. The story should help a child relax and feel safe. End on a cozy, sleepy note.',
    'funny': 'Write with humor and playfulness! Include silly situations, funny dialogue, sound effects (like "SPLAT!" or "Whoooosh!"), and moments that will make children giggle. Keep the energy light and joyful.',
    'adventure': 'Write with excitement and energy! Include brave moments, interesting challenges to overcome, and a sense of wonder and discovery. Make the characters feel heroic and capable.',
    'mystery': 'Write with curiosity and intrigue! Include clues to discover, questions to solve, and "aha!" moments. Build gentle suspense appropriate for children, with a satisfying resolution.',
  };

  const ageGuidance: Record<string, string> = {
    '2-4': 'Use very simple words and short sentences. Lots of repetition is good. Focus on familiar concepts (animals, family, colors, feelings). Keep the plot straightforward with 1-2 simple events. Use onomatopoeia and rhythmic language.',
    '5-7': 'Use engaging vocabulary with some new words to learn. Sentences can be longer with more description. Include dialogue between characters. The plot can have 2-3 events with simple cause-and-effect. Add gentle lessons about friendship, kindness, or bravery.',
    '8-10': 'Use rich vocabulary and varied sentence structures. Include more complex emotions and character development. The plot can have multiple events, minor challenges, and character growth. Themes can be more sophisticated while remaining age-appropriate.',
  };

  const lengthGuidance: Record<string, string> = {
    'quick': 'Write approximately 300-400 words (2-3 minute read). Get to the heart of the story quickly.',
    'medium': 'Write approximately 600-800 words (5 minute read). Allow time for setting and character moments.',
    'epic': 'Write approximately 1000-1200 words (10 minute read). Include rich details, dialogue, and a well-developed arc.',
  };

  const styleGuidance: Record<string, string> = {
    'classic': 'Write in classic fairytale style. Begin with "Once upon a time..." and end with a satisfying conclusion. Use timeless storytelling elements and a warm, traditional narrative voice.',
    'modern': 'Write in a contemporary style. The setting should feel current and relatable. Characters can use modern expressions. The narrative voice should be fresh and engaging.',
    'fantasy': 'Write with magical and fantastical elements. Include wonder, enchantment, and imagination. Create a world where amazing things are possible. Use vivid, magical descriptions.',
    'animal': 'Feature animals as main characters who can talk and have personalities. Give them relatable emotions and adventures. The animals should be charming and expressive.',
  };

  return `You are a master bedtime storyteller. Your task is to write a personalized, calming bedtime story based on the parent's specific request.

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

Now write the story. Remember: The names and characters from the parent's request are SACRED - use them exactly as provided!`;
}

function parseStoryResponse(text: string): { title: string; content: string } {
  const lines = text.trim().split('\n');

  let titleIndex = 0;
  while (titleIndex < lines.length && !lines[titleIndex].trim()) {
    titleIndex++;
  }

  const title = lines[titleIndex]?.trim() || 'A Magical Story';

  let contentStartIndex = titleIndex + 1;
  while (contentStartIndex < lines.length && !lines[contentStartIndex].trim()) {
    contentStartIndex++;
  }

  const content = lines.slice(contentStartIndex).join('\n').trim();

  return { title, content };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      );
    }

    const user = await syncUserToSupabase(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress || ''
    );

    // Get subscription and check limits
    const subscription = await getUserSubscription(user.id);
    if (!subscription) {
      return NextResponse.json(
        { error: 'Unable to retrieve subscription details' },
        { status: 500 }
      );
    }

    const canGenerate = await canGenerateStory(user.id, subscription.tier, false);
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
          upgrade: { message: 'Upgrade to create more stories' },
        },
        { status: 403 }
      );
    }

    // Fetch the original story
    const { data: originalStory, error: fetchError } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !originalStory) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check regeneration limit
    const currentRegenerations = originalStory.regeneration_count || 0;
    if (currentRegenerations >= MAX_REGENERATIONS) {
      return NextResponse.json(
        {
          error: `Maximum regeneration limit reached (${MAX_REGENERATIONS})`,
          current_regenerations: currentRegenerations,
          max_regenerations: MAX_REGENERATIONS,
        },
        { status: 400 }
      );
    }

    // Get original parameters - use defaults since original metadata isn't stored
    const tone = originalStory.tone || 'bedtime-calm';
    const length = originalStory.length || 'medium';
    // Default values for parameters not stored in DB
    const storyRequest = 'A magical adventure story';
    const ageGroup = '5-7';
    const style = 'classic';

    console.log('[regenerate-story] Regenerating story:', {
      originalId: params.id,
      regenerationCount: currentRegenerations + 1,
      parameters: { tone, ageGroup, length, style },
    });

    // Build prompt with same parameters
    const prompt = buildStoryPrompt({
      storyRequest,
      tone,
      ageGroup,
      length,
      style,
    });

    // Generate new story with GPT-5 mini (with fallback to GPT-4o)
    let responseText: string | null = null;
    let modelUsed = 'gpt-5-mini';

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 8000,
      });
      responseText = completion.choices[0]?.message?.content;

      if (!responseText || responseText.trim().length < 50) {
        throw new Error('GPT-5 mini returned empty or too short response');
      }
    } catch (gpt5Error: any) {
      console.error('[regenerate-story] GPT-5 mini failed, trying GPT-4o:', gpt5Error.message);
      modelUsed = 'gpt-4o';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.8,
      });
      responseText = completion.choices[0]?.message?.content;
    }

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    // Parse title and content
    const { title, content } = parseStoryResponse(responseText);
    const wordCount = content.split(/\s+/).length;

    // Calculate quality score
    const qualityScore = scoreStoryQuality(content, {
      storyRequest,
      ageGroup,
      targetLength: length as 'quick' | 'medium' | 'epic',
    });

    console.log('[regenerate-story] New story generated:', {
      title,
      wordCount,
      qualityScore: qualityScore.total,
    });

    // Update original story with new content
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from('stories')
      .update({
        title,
        content,
        word_count: wordCount,
        ai_model: modelUsed,
        regeneration_count: currentRegenerations + 1,
        quality_score: qualityScore.total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[regenerate-story] Database error:', updateError);
      throw new Error('Failed to update story');
    }

    // Track usage (counts as a new story generation)
    await trackStoryGeneration(user.id, { usedPremiumVoice: false });

    // Get updated usage
    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start)
      : undefined;
    const updatedUsage = await getCurrentUsage(user.id, periodStart);

    return NextResponse.json({
      success: true,
      story: {
        id: updatedStory.id,
        title,
        content,
        wordCount,
        qualityScore: qualityScore.total,
        qualityBreakdown: qualityScore.breakdown,
        qualityIssues: qualityScore.issues,
        regenerationCount: currentRegenerations + 1,
        maxRegenerations: MAX_REGENERATIONS,
      },
      usage: {
        stories_generated: updatedUsage.stories_generated,
        stories_remaining: canGenerate.storyCheck.limit - updatedUsage.stories_generated,
        billing_period_end: updatedUsage.billing_period_end,
        tier: subscription.tier,
      },
    });
  } catch (error: any) {
    console.error('[regenerate-story] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate story' },
      { status: 500 }
    );
  }
}
