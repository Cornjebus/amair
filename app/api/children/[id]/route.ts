import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring/sentry'

// =============================================================================
// GET /api/children/[id] - Get a specific child profile
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    const { id } = await params

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

    // Get child profile - verify ownership
    const { data: child, error } = await supabaseAdmin
      .from('children')
      .select('id, name, age, avatar_url, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json({ child })
  } catch (error) {
    captureError(error as Error, { action: 'get_child' })
    console.error('[children] Error getting child:', error)
    return NextResponse.json(
      { error: 'Failed to get child profile' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH /api/children/[id] - Update a child profile
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    const { id } = await params

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
    const allowedFields = ['name', 'age', 'avatar_url']

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Validate age if provided
        if (field === 'age' && body[field] !== null) {
          const ageNum = parseInt(body[field], 10)
          if (isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
            return NextResponse.json(
              { error: 'Age must be between 0 and 18' },
              { status: 400 }
            )
          }
          updates[field] = ageNum
        } else if (field === 'name') {
          // Validate name
          if (!body[field] || body[field].trim().length === 0) {
            return NextResponse.json(
              { error: 'Child name cannot be empty' },
              { status: 400 }
            )
          }
          updates[field] = body[field].trim()
        } else {
          updates[field] = body[field]
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update child profile - verify ownership
    const { data: child, error } = await supabaseAdmin
      .from('children')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    console.log('[children] Updated child profile:', child.id, child.name)

    return NextResponse.json({ child })
  } catch (error) {
    captureError(error as Error, { action: 'update_child' })
    console.error('[children] Error updating child:', error)
    return NextResponse.json(
      { error: 'Failed to update child profile' },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE /api/children/[id] - Delete a child profile
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    const { id } = await params

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

    // Delete child profile - verify ownership
    // This is a hard delete since children table has ON DELETE CASCADE
    const { error } = await supabaseAdmin
      .from('children')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    console.log('[children] Deleted child profile:', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    captureError(error as Error, { action: 'delete_child' })
    console.error('[children] Error deleting child:', error)
    return NextResponse.json(
      { error: 'Failed to delete child profile' },
      { status: 500 }
    )
  }
}
