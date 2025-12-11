import { supabaseAdmin } from '@/lib/supabase/server'

// Cast to any for new tables until types are regenerated
const supabase = supabaseAdmin as any

/**
 * Universe Context Builder
 *
 * Builds context from the family's story universe to provide to the AI
 * for more personalized and continuous storytelling.
 */

export interface CharacterContext {
  id: string
  name: string
  gender?: string
  description?: string
  personality?: string
  favorite_things?: string[]
  role: string
  stories_count: number
}

export interface StoryMemory {
  id: string
  memory_type: string
  summary: string
  importance: number
}

export interface UniverseContext {
  characters: CharacterContext[]
  recentMemories: StoryMemory[]
  universeSettings: {
    enable_character_continuity: boolean
    enable_story_callbacks: boolean
  }
  contextPrompt: string
}

/**
 * Build universe context for AI story generation
 */
export async function buildUniverseContext(
  userId: string,
  selectedCharacterIds?: string[]
): Promise<UniverseContext | null> {
  try {
    // Get universe settings
    const { data: universe } = await supabase
      .from('family_universes')
      .select('enable_character_continuity, enable_story_callbacks')
      .eq('user_id', userId)
      .single()

    // If no universe or continuity disabled, return null
    if (!universe?.enable_character_continuity) {
      return null
    }

    // Get characters (selected ones first, then top characters)
    let characters: CharacterContext[] = []

    if (selectedCharacterIds && selectedCharacterIds.length > 0) {
      const { data: selectedChars } = await supabase
        .from('characters')
        .select('id, name, gender, description, personality, favorite_things, role, stories_count')
        .in('id', selectedCharacterIds)
        .eq('user_id', userId)
        .eq('is_active', true)

      characters = selectedChars || []
    } else {
      // Get top 3 most used characters
      const { data: topChars } = await supabase
        .from('characters')
        .select('id, name, gender, description, personality, favorite_things, role, stories_count')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('stories_count', { ascending: false })
        .limit(3)

      characters = topChars || []
    }

    // Get recent story memories if callbacks enabled
    let recentMemories: StoryMemory[] = []

    if (universe.enable_story_callbacks) {
      const { data: memories } = await supabase
        .from('story_memories')
        .select('id, memory_type, summary, importance')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      recentMemories = memories || []
    }

    // Build the context prompt
    const contextPrompt = buildContextPrompt(characters, recentMemories)

    return {
      characters,
      recentMemories,
      universeSettings: {
        enable_character_continuity: universe.enable_character_continuity,
        enable_story_callbacks: universe.enable_story_callbacks,
      },
      contextPrompt,
    }
  } catch (error) {
    console.error('Error building universe context:', error)
    return null
  }
}

/**
 * Build a prompt string from universe context
 */
function buildContextPrompt(
  characters: CharacterContext[],
  memories: StoryMemory[]
): string {
  const parts: string[] = []

  // Add character context
  if (characters.length > 0) {
    parts.push('RECURRING CHARACTERS IN THIS FAMILY\'S STORY UNIVERSE:')

    for (const char of characters) {
      const charDetails = [
        `- ${char.name}`,
        char.gender ? `(${char.gender})` : '',
        char.role !== 'protagonist' ? `[${char.role}]` : '',
      ].filter(Boolean).join(' ')

      parts.push(charDetails)

      if (char.description) {
        parts.push(`  Appearance: ${char.description}`)
      }
      if (char.personality) {
        parts.push(`  Personality: ${char.personality}`)
      }
      if (char.favorite_things && char.favorite_things.length > 0) {
        parts.push(`  Loves: ${char.favorite_things.join(', ')}`)
      }
      if (char.stories_count > 1) {
        parts.push(`  (Has appeared in ${char.stories_count} stories)`)
      }
    }

    parts.push('')
  }

  // Add story memories
  if (memories.length > 0) {
    parts.push('PREVIOUS ADVENTURES (you may subtly reference these):')

    for (const memory of memories) {
      parts.push(`- ${memory.summary}`)
    }

    parts.push('')
  }

  if (parts.length === 0) {
    return ''
  }

  return parts.join('\n')
}

/**
 * Extract and save a memory from a generated story
 */
export async function extractStoryMemory(
  userId: string,
  storyId: string,
  storyContent: string,
  characterIds: string[]
): Promise<void> {
  try {
    // Simple memory extraction - in production, use AI to generate better summaries
    const sentences = storyContent.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const middleSentence = sentences[Math.floor(sentences.length / 2)]?.trim()

    if (!middleSentence) return

    // Create a basic memory
    await supabase.from('story_memories').insert({
      user_id: userId,
      story_id: storyId,
      memory_type: 'adventure',
      summary: middleSentence.slice(0, 200),
      importance: 5,
      character_ids: characterIds.length > 0 ? characterIds : null,
    })
  } catch (error) {
    console.error('Error extracting story memory:', error)
    // Non-critical, don't throw
  }
}

/**
 * Link characters to a story
 */
export async function linkCharactersToStory(
  storyId: string,
  characterIds: string[]
): Promise<void> {
  if (characterIds.length === 0) return

  try {
    const inserts = characterIds.map((characterId) => ({
      story_id: storyId,
      character_id: characterId,
    }))

    await supabase.from('story_characters').insert(inserts)
  } catch (error) {
    console.error('Error linking characters to story:', error)
    // Non-critical, don't throw
  }
}
