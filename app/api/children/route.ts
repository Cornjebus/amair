import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { syncUserToSupabase } from '@/lib/supabase/sync-user'
import { captureError } from '@/lib/monitoring/sentry'

// =============================================================================
// GET /api/children - List all children for the authenticated user
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

    // Get all children for this user
    const { data: children, error } = await supabaseAdmin
      .from('children')
      .select('id, name, age, avatar_url, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ children })
  } catch (error) {
    captureError(error as Error, { action: 'list_children' })
    console.error('[children] Error listing children:', error)
    return NextResponse.json(
      { error: 'Failed to list children' },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST /api/children - Create a new child profile
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
    const { name, age, avatar_url } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Child name is required' },
        { status: 400 }
      )
    }

    // Validate age if provided
    if (age !== null && age !== undefined) {
      const ageNum = parseInt(age, 10)
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
        return NextResponse.json(
          { error: 'Age must be between 0 and 18' },
          { status: 400 }
        )
      }
    }

    // Create child profile
    const { data: child, error } = await supabaseAdmin
      .from('children')
      .insert({
        user_id: user.id,
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        avatar_url: avatar_url || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('[children] Created child profile:', child.id, child.name)

    return NextResponse.json({ child }, { status: 201 })
  } catch (error) {
    captureError(error as Error, { action: 'create_child' })
    console.error('[children] Error creating child:', error)
    return NextResponse.json(
      { error: 'Failed to create child profile' },
      { status: 500 }
    )
  }
}
