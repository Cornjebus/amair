import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { clerkUserId, action = 'test' } = await req.json()

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'clerkUserId is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single()

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'User not found in Supabase',
        details: fetchError,
      })
    }

    if (action === 'test') {
      return NextResponse.json({
        success: true,
        message: 'User found',
        user: {
          id: user.id,
          clerk_id: user.clerk_id,
          email: user.email,
          subscription_status: user.subscription_status,
          stripe_customer_id: user.stripe_customer_id,
          subscription_end_date: user.subscription_end_date,
        },
      })
    }

    if (action === 'upgrade') {
      // Test upgrade
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_end_date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('clerk_id', clerkUserId)

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to upgrade user',
          details: updateError,
        })
      }

      // Verify update
      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUserId)
        .single()

      return NextResponse.json({
        success: true,
        message: 'User upgraded successfully',
        user: updatedUser
          ? {
              id: updatedUser.id,
              clerk_id: updatedUser.clerk_id,
              email: updatedUser.email,
              subscription_status: updatedUser.subscription_status,
              stripe_customer_id: updatedUser.stripe_customer_id,
              subscription_end_date: updatedUser.subscription_end_date,
            }
          : null,
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    })
  } catch (err: any) {
    console.error('Test webhook error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    )
  }
}
