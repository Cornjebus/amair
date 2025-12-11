import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring/sentry'

// Cast to any for new tables until types are regenerated
const supabase = supabaseAdmin as any

// =============================================================================
// GET /api/characters - List all characters for the user
// =============================================================================

export async function GET(request: NextRequest) {
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

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') !== 'false'
    const role = searchParams.get('role')

    // Build query
    let query = supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('last_appeared_at', { ascending: false, nullsFirst: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data: characters, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ characters })
  } catch (error) {
    captureError(error as Error, { action: 'list_characters' })
    console.error('Error listing characters:', error)
    return NextResponse.json(
      { error: 'Failed to list characters' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/characters - Create a new character
// =============================================================================

export async function POST(request: NextRequest) {
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
    const {
      name,
      nickname,
      gender,
      age_range,
      description,
      personality,
      favorite_things,
      role = 'protagonist',
      avatar_url,
      illustration_style,
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Character name is required' },
        { status: 400 }
      )
    }

    // Create character
    const { data: character, error } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name: name.trim(),
        nickname: nickname?.trim() || null,
        gender,
        age_range,
        description: description?.trim() || null,
        personality: personality?.trim() || null,
        favorite_things: favorite_things || [],
        role,
        avatar_url,
        illustration_style,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Ensure universe exists (character count will be updated via trigger)
    await supabase.rpc('get_or_create_universe', { p_user_id: user.id })

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    captureError(error as Error, { action: 'create_character' })
    console.error('Error creating character:', error)
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    )
  }
}
