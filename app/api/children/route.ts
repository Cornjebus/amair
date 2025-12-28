import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDatabase } from '@/lib/database'
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

    const db = await getDatabase()

    // Get user from Clerk ID
    const user = await db.users.findByClerkId(clerkUserId)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all children for this user
    const children = await db.children.findByUserId(user.id)

    // Map to API response format (snake_case for backwards compatibility)
    const formattedChildren = children.map(child => ({
      id: child.id,
      name: child.name,
      age: child.age,
      avatar_url: child.avatarUrl,
      created_at: child.createdAt,
      updated_at: child.updatedAt,
    }))

    return NextResponse.json({ children: formattedChildren })
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

    const db = await getDatabase()

    // Get user from Clerk ID
    const user = await db.users.findByClerkId(clerkUserId)

    if (!user) {
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

    // Create child profile using DAL
    const child = await db.children.create({
      userId: user.id,
      name: name.trim(),
      age: age ? parseInt(age, 10) : null,
      avatarUrl: avatar_url || null,
    })

    console.log('[children] Created child profile:', child.id, child.name)

    // Map to API response format (snake_case for backwards compatibility)
    const formattedChild = {
      id: child.id,
      user_id: child.userId,
      name: child.name,
      age: child.age,
      avatar_url: child.avatarUrl,
      created_at: child.createdAt,
      updated_at: child.updatedAt,
    }

    return NextResponse.json({ child: formattedChild }, { status: 201 })
  } catch (error) {
    captureError(error as Error, { action: 'create_child' })
    console.error('[children] Error creating child:', error)
    return NextResponse.json(
      { error: 'Failed to create child profile' },
      { status: 500 }
    )
  }
}
