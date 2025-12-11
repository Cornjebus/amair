import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring/sentry'

// Cast to any for new tables until types are regenerated
const supabase = supabaseAdmin as any

// =============================================================================
// GET /api/universe - Get user's family universe with stats
// =============================================================================

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create universe
    const { data: universeId } = await supabase
      .rpc('get_or_create_universe', { p_user_id: user.id })

    // Get universe with stats
    const { data: universe, error } = await supabase
      .from('family_universes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      throw error
    }

    // Get top characters
    const { data: topCharacters } = await supabase
      .from('characters')
      .select('id, name, avatar_url, role, stories_count')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('stories_count', { ascending: false })
      .limit(5)

    // Get recent stories
    const { data: recentStories } = await supabaseAdmin
      .from('stories')
      .select('id, title, tone, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get theme distribution
    const { data: themeStats } = await supabaseAdmin
      .from('stories')
      .select('tone')
      .eq('user_id', user.id)

    const themeCounts: Record<string, number> = {}
    themeStats?.forEach((story) => {
      if (story.tone) {
        themeCounts[story.tone] = (themeCounts[story.tone] || 0) + 1
      }
    })

    return NextResponse.json({
      universe: {
        ...universe,
        topCharacters: topCharacters || [],
        recentStories: recentStories || [],
        themeDistribution: themeCounts,
      },
    })
  } catch (error) {
    captureError(error as Error, { action: 'get_universe' })
    console.error('Error getting universe:', error)
    return NextResponse.json(
      { error: 'Failed to get universe' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH /api/universe - Update universe settings
// =============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const allowedFields = [
      'universe_name',
      'description',
      'default_art_style',
      'default_tone',
      'enable_character_continuity',
      'enable_story_callbacks',
    ]

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    // Ensure universe exists
    await supabase.rpc('get_or_create_universe', { p_user_id: user.id })

    // Update universe
    const { data: universe, error } = await supabase
      .from('family_universes')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ universe })
  } catch (error) {
    captureError(error as Error, { action: 'update_universe' })
    console.error('Error updating universe:', error)
    return NextResponse.json(
      { error: 'Failed to update universe' },
      { status: 500 }
    )
  }
}
