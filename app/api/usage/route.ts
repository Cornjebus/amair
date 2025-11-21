import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscription/manager'
import { getCurrentUsage } from '@/lib/subscription/usage'
import { getTierLimits } from '@/lib/subscription/tiers'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription details
    const subscription = await getUserSubscription(user.id)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Unable to retrieve subscription' },
        { status: 500 }
      )
    }

    // Get current usage
    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : undefined
    const usage = await getCurrentUsage(user.id, periodStart)

    // Get tier limits
    const limits = getTierLimits(subscription.tier)

    return NextResponse.json({
      stories_generated: usage.stories_generated,
      stories_limit: limits.monthly_stories,
      premium_voices_used: usage.premium_voices_used,
      premium_voices_limit: limits.monthly_premium_voices,
      billing_period_end: usage.billing_period_end,
      tier: subscription.tier,
    })
  } catch (error: any) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
