import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChildData {
  name: string
  gender: 'boy' | 'girl' | 'other'
  itemCount: number
  items: string[]
}

interface StoryConfig {
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
}

const getLengthInstructions = (length: string): string => {
  const instructions = {
    quick: 'Keep the story brief and engaging, about 300-400 words. Perfect for a quick bedtime story.',
    medium: 'Create a medium-length story of about 600-800 words with a clear beginning, middle, and end.',
    epic: 'Craft a longer, more detailed story of about 1200-1500 words with rich descriptions and character development.',
  }
  return instructions[length as keyof typeof instructions] || instructions.medium
}

const getToneInstructions = (tone: string): string => {
  const instructions = {
    'bedtime-calm': 'Use gentle, soothing language. The story should be warm and comforting, perfect for helping children wind down for sleep. Include peaceful imagery and a cozy atmosphere. End with everyone safe and ready for sleep.',
    'funny': 'Make the story humorous and playful with silly situations, funny dialogue, and light-hearted moments that will make children giggle. Keep it family-friendly and joyful.',
    'adventure': 'Create an exciting adventure with challenges to overcome, new places to explore, and brave characters. Include action and discovery while keeping it age-appropriate.',
    'mystery': 'Build a gentle mystery with clues to discover and a puzzle to solve. Keep it intriguing but not scary, suitable for young children.',
  }
  return instructions[tone as keyof typeof instructions] || instructions['bedtime-calm']
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

    // Check subscription status
    if (user.subscription_status === 'free') {
      // Check story count for free users (limit to 3 per month)
      const { count } = await supabaseAdmin
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(new Date().setDate(1)).toISOString())

      if (count && count >= 3) {
        return NextResponse.json(
          { error: 'Free tier limit reached. Please upgrade to premium.' },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const { children, config }: { children: ChildData[]; config: StoryConfig } = body

    // Build the prompt
    let prompt = `Create a ${config.tone} bedtime story that includes the following elements:\n\n`

    // Add character info with pronouns
    prompt += `Characters:\n`
    children.forEach((child) => {
      const pronouns = child.gender === 'girl' ? 'she/her' : child.gender === 'boy' ? 'he/him' : 'they/them'
      prompt += `- ${child.name} (${pronouns}): ${child.items.join(', ')}\n`
    })

    prompt += `\n${getToneInstructions(config.tone)}\n`
    prompt += `${getLengthInstructions(config.length)}\n\n`
    prompt += `The story should:\n`
    prompt += `- Include ALL the special things naturally in the narrative\n`
    prompt += `- Feature ${children.map((c) => c.name).join(' and ')} as the main character(s)\n`
    prompt += `- Use the correct pronouns for each character as specified above\n`
    prompt += `- Have a clear beginning, middle, and end\n`
    prompt += `- Be appropriate for children ages 3-10\n`
    prompt += `- Include dialogue and descriptive language\n`
    prompt += `- Have a satisfying conclusion\n\n`
    prompt += `Please provide:\n1. A creative title\n2. The complete story`

    // Generate story with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are Amari, a magical bedtime storyteller who creates warm, imaginative, and family-friendly stories for children. Your stories are creative, engaging, and always include all the elements requested.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    })

    const response = completion.choices[0].message.content || ''

    // Parse title and content (simple parsing)
    const lines = response.split('\n')
    let title = 'A Magical Story'
    let content = response

    // Try to extract title if it's in the format "Title: ..." or "# Title"
    if (lines[0].toLowerCase().startsWith('title:')) {
      title = lines[0].replace(/^title:\s*/i, '').trim()
      content = lines.slice(1).join('\n').trim()
    } else if (lines[0].startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim()
      content = lines.slice(1).join('\n').trim()
    }

    // Count words
    const wordCount = content.split(/\s+/).length

    // Save story to database
    const { data: story, error } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: user.id,
        title,
        content,
        tone: config.tone,
        length: config.length,
        word_count: wordCount,
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

    return NextResponse.json({
      story: {
        id: story.id,
        title,
        content,
        wordCount,
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
