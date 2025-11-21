'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sparkles, Zap, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UsageData {
  stories_generated: number
  stories_limit: number
  premium_voices_used: number
  premium_voices_limit: number
  billing_period_end: string
  tier: string
}

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const storiesPercentage = (usage.stories_generated / usage.stories_limit) * 100
  const voicesPercentage = usage.premium_voices_limit > 0
    ? (usage.premium_voices_used / usage.premium_voices_limit) * 100
    : 0

  const daysUntilReset = Math.ceil(
    (new Date(usage.billing_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const nearLimit = storiesPercentage >= 80

  return (
    <Card className={nearLimit ? 'border-amber-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Your Usage
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {usage.tier.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
        </CardTitle>
        <CardDescription>
          Track your story creation and premium voice usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stories Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Stories Created</span>
            <span className="text-muted-foreground">
              {usage.stories_generated} / {usage.stories_limit}
            </span>
          </div>
          <Progress value={storiesPercentage} className="h-2" />
          {nearLimit && (
            <p className="text-xs text-amber-600">
              You're running low on stories! Consider upgrading for more.
            </p>
          )}
        </div>

        {/* Premium Voices Usage */}
        {usage.premium_voices_limit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Premium Voices
              </span>
              <span className="text-muted-foreground">
                {usage.premium_voices_used} / {usage.premium_voices_limit}
              </span>
            </div>
            <Progress value={voicesPercentage} className="h-2" />
          </div>
        )}

        {/* Billing Period */}
        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Resets in
          </span>
          <span className="font-medium">
            {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Upgrade CTA */}
        {nearLimit && usage.tier === 'free' && (
          <Button
            onClick={() => router.push('/pricing')}
            className="w-full"
            variant="default"
          >
            Upgrade for More Stories
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
