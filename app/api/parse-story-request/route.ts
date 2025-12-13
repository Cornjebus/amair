import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { captureError } from '@/lib/monitoring/sentry'
import { supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Cast to any for new tables
const supabase = supabaseAdmin as any

// Initialize OpenAI client
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

/**
 * POST /api/parse-story-request
 *
 * Parses natural language input to extract story parameters.
 * Uses GPT-5 nano to understand the user's intent and extract:
 * - Child name(s)
 * - Theme/tone
 * - Custom elements (animals, objects, places)
 * - Story length preference
 */

interface ParsedStoryRequest {
  childName: string
  childAge?: number
  gender?: 'boy' | 'girl' | 'other'
  theme: string
  tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery'
  length: 'quick' | 'medium' | 'epic'
  customElements: string[]
  suggestedCharacters?: Array<{ id: string; name: string }>
  confidence: number
  originalInput: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { input } = body

    if (!input || typeof input !== 'string' || input.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a story description' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's characters for matching
    const { data: characters } = await supabase
      .from('characters')
      .select('id, name, gender, age_range')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(20)

    // Parse the input using GPT-5 nano for intelligent extraction
    const parsed = await parseStoryInputWithAI(input, characters || [])

    return NextResponse.json({ parsed })
  } catch (error) {
    captureError(error as Error, { action: 'parse_story_request' })
    console.error('Error parsing story request:', error)
    return NextResponse.json(
      { error: 'Failed to parse story request' },
      { status: 500 }
    )
  }
}

/**
 * Parse natural language input using GPT-5 nano for intelligent extraction
 */
async function parseStoryInputWithAI(
  input: string,
  existingCharacters: Array<{ id: string; name: string; gender?: string; age_range?: string }>
): Promise<ParsedStoryRequest> {
  const client = getOpenAIClient()

  // Build character context if user has saved characters
  const characterContext = existingCharacters.length > 0
    ? `\n\nThe user has these saved characters: ${existingCharacters.map(c => `${c.name} (${c.gender || 'unknown gender'})`).join(', ')}. If the input mentions any of these names, include their IDs in suggestedCharacters.`
    : ''

  const systemPrompt = `You are a story request parser for a children's bedtime story app called Amari.
Extract story parameters from natural language input and return a JSON object.

IMPORTANT: Preserve ALL specific details from the user's input - names of pets, friends, favorite things, personality traits, etc. These should go in customElements.

Return ONLY valid JSON with this exact structure:
{
  "childName": "the main child's name",
  "childAge": number or null,
  "gender": "boy" | "girl" | "other" | null,
  "theme": "main theme of the story",
  "tone": "bedtime-calm" | "funny" | "adventure" | "mystery",
  "length": "quick" | "medium" | "epic",
  "customElements": ["array", "of", "specific", "elements", "to", "include"],
  "suggestedCharacters": [{"id": "char_id", "name": "char_name"}] or null,
  "confidence": 0.0 to 1.0
}

Guidelines:
- childName: Extract the child's name. Default to "the hero" if unclear.
- gender: Infer from "son/daughter", "he/she", or explicit mentions.
- tone: Default to "bedtime-calm" unless user wants funny/adventure/mystery.
- length: Default to "medium". Use "quick" for short, "epic" for long requests.
- customElements: Include ALL specific things mentioned - pet names, favorite toys, places, animals, characters, activities, etc. Be thorough!
- confidence: Higher if name is clear and elements are specific.${characterContext}`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0.3,
      max_completion_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(responseText)

    // Match any mentioned characters from the user's saved characters
    const matchedCharacters: Array<{ id: string; name: string }> = []
    const lowerInput = input.toLowerCase()
    for (const char of existingCharacters) {
      if (lowerInput.includes(char.name.toLowerCase())) {
        matchedCharacters.push({ id: char.id, name: char.name })
      }
    }

    return {
      childName: parsed.childName || 'the hero',
      childAge: parsed.childAge || undefined,
      gender: parsed.gender || undefined,
      theme: parsed.theme || 'magical adventure',
      tone: parsed.tone || 'bedtime-calm',
      length: parsed.length || 'medium',
      customElements: parsed.customElements || [],
      suggestedCharacters: matchedCharacters.length > 0 ? matchedCharacters : parsed.suggestedCharacters,
      confidence: parsed.confidence || 0.7,
      originalInput: input,
    }
  } catch (error) {
    console.error('Error parsing with AI, falling back to basic parsing:', error)
    // Fallback to basic extraction if AI fails
    return fallbackParse(input, existingCharacters)
  }
}

/**
 * Fallback parser if AI parsing fails
 */
function fallbackParse(
  input: string,
  existingCharacters: Array<{ id: string; name: string; gender?: string }>
): ParsedStoryRequest {
  const lowerInput = input.toLowerCase()

  // Basic name extraction
  let childName = 'the hero'
  const nameMatch = input.match(/(?:about|for|with)\s+([A-Z][a-z]+)/i)
  if (nameMatch) childName = nameMatch[1]

  // Basic tone detection
  let tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery' = 'bedtime-calm'
  if (lowerInput.includes('funny') || lowerInput.includes('silly')) tone = 'funny'
  else if (lowerInput.includes('adventure')) tone = 'adventure'
  else if (lowerInput.includes('mystery')) tone = 'mystery'

  // Check for existing characters
  const matchedCharacters: Array<{ id: string; name: string }> = []
  for (const char of existingCharacters) {
    if (lowerInput.includes(char.name.toLowerCase())) {
      matchedCharacters.push({ id: char.id, name: char.name })
      if (childName === 'the hero') childName = char.name
    }
  }

  return {
    childName,
    theme: 'magical adventure',
    tone,
    length: 'medium',
    customElements: [],
    suggestedCharacters: matchedCharacters.length > 0 ? matchedCharacters : undefined,
    confidence: 0.5,
    originalInput: input,
  }
}
