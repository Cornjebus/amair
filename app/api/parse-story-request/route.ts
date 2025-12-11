import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAIService } from '@/lib/ai'
import { captureError } from '@/lib/monitoring/sentry'
import { supabaseAdmin } from '@/lib/supabase/server'

// Cast to any for new tables
const supabase = supabaseAdmin as any

/**
 * POST /api/parse-story-request
 *
 * Parses natural language input to extract story parameters.
 * Uses AI to understand the user's intent and extract:
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

    // Parse the input using simple pattern matching first
    const parsed = parseStoryInput(input, characters || [])

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
 * Parse natural language input to extract story parameters
 */
function parseStoryInput(
  input: string,
  existingCharacters: Array<{ id: string; name: string; gender?: string; age_range?: string }>
): ParsedStoryRequest {
  const lowerInput = input.toLowerCase()

  // Extract child name - look for common patterns
  let childName = 'the hero'
  let gender: 'boy' | 'girl' | 'other' | undefined = undefined

  // Check for existing characters first
  const matchedCharacters: Array<{ id: string; name: string }> = []
  for (const char of existingCharacters) {
    if (lowerInput.includes(char.name.toLowerCase())) {
      matchedCharacters.push({ id: char.id, name: char.name })
      if (!childName || childName === 'the hero') {
        childName = char.name
        gender = char.gender as 'boy' | 'girl' | 'other' | undefined
      }
    }
  }

  // Look for name patterns
  const namePatterns = [
    /(?:story (?:about|for|with) )([A-Z][a-z]+)/i,
    /([A-Z][a-z]+)'s (?:adventure|story|journey)/i,
    /(?:my (?:son|daughter|child) )([A-Z][a-z]+)/i,
    /(?:named? )([A-Z][a-z]+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = input.match(pattern)
    if (match && match[1]) {
      childName = match[1]
      break
    }
  }

  // Extract gender hints
  if (!gender) {
    if (lowerInput.includes('my son') || lowerInput.includes('my boy') || lowerInput.includes(' he ')) {
      gender = 'boy'
    } else if (lowerInput.includes('my daughter') || lowerInput.includes('my girl') || lowerInput.includes(' she ')) {
      gender = 'girl'
    }
  }

  // Determine tone
  let tone: 'bedtime-calm' | 'funny' | 'adventure' | 'mystery' = 'bedtime-calm'
  if (lowerInput.includes('funny') || lowerInput.includes('silly') || lowerInput.includes('laugh')) {
    tone = 'funny'
  } else if (lowerInput.includes('adventure') || lowerInput.includes('exciting') || lowerInput.includes('brave')) {
    tone = 'adventure'
  } else if (lowerInput.includes('mystery') || lowerInput.includes('puzzle') || lowerInput.includes('secret')) {
    tone = 'mystery'
  } else if (lowerInput.includes('bedtime') || lowerInput.includes('sleep') || lowerInput.includes('calm') || lowerInput.includes('soothing')) {
    tone = 'bedtime-calm'
  }

  // Determine length
  let length: 'quick' | 'medium' | 'epic' = 'medium'
  if (lowerInput.includes('short') || lowerInput.includes('quick') || lowerInput.includes('brief')) {
    length = 'quick'
  } else if (lowerInput.includes('long') || lowerInput.includes('epic') || lowerInput.includes('detailed')) {
    length = 'epic'
  }

  // Extract custom elements (animals, objects, places)
  const customElements: string[] = []

  // Animals
  const animals = ['dog', 'cat', 'dragon', 'unicorn', 'bunny', 'rabbit', 'bear', 'lion', 'dinosaur', 'horse', 'butterfly', 'bird', 'owl', 'fox', 'wolf', 'elephant', 'monkey', 'fish', 'dolphin', 'whale']
  for (const animal of animals) {
    if (lowerInput.includes(animal)) {
      customElements.push(animal)
    }
  }

  // Places
  const places = ['castle', 'forest', 'ocean', 'space', 'moon', 'jungle', 'mountain', 'beach', 'garden', 'farm', 'kingdom', 'village', 'city']
  for (const place of places) {
    if (lowerInput.includes(place)) {
      customElements.push(place)
    }
  }

  // Objects/themes
  const objects = ['rainbow', 'treasure', 'magic', 'star', 'princess', 'prince', 'knight', 'wizard', 'fairy', 'mermaid', 'pirate', 'robot', 'superhero']
  for (const obj of objects) {
    if (lowerInput.includes(obj)) {
      customElements.push(obj)
    }
  }

  // Generate theme from input
  let theme = 'magical adventure'
  if (customElements.length > 0) {
    theme = customElements.slice(0, 3).join(' and ')
  } else if (tone === 'bedtime-calm') {
    theme = 'bedtime dreams'
  } else if (tone === 'funny') {
    theme = 'silly fun'
  } else if (tone === 'mystery') {
    theme = 'solving a mystery'
  }

  // Calculate confidence
  let confidence = 0.5
  if (childName !== 'the hero') confidence += 0.2
  if (customElements.length > 0) confidence += 0.2
  if (matchedCharacters.length > 0) confidence += 0.1

  return {
    childName,
    gender,
    theme,
    tone,
    length,
    customElements,
    suggestedCharacters: matchedCharacters.length > 0 ? matchedCharacters : undefined,
    confidence: Math.min(confidence, 1),
    originalInput: input,
  }
}
