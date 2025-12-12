'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, BookOpen, Zap, Crown, Star, ArrowRight, Gift, Mic, Clock } from 'lucide-react'

// Subscription tier configuration with Amari colors
const TIER_CONFIG = {
  free: {
    name: 'Free',
    storiesPerMonth: 3,
    premiumVoices: 0,
    color: 'amari-muted',
    icon: BookOpen,
  },
  dream_weaver: {
    name: 'Dream Weaver',
    storiesPerMonth: 10,
    premiumVoices: 3,
    color: 'amari-sage',
    icon: Star,
  },
  magic_circle: {
    name: 'Magic Circle',
    storiesPerMonth: 30,
    premiumVoices: 15,
    color: 'amari-terracotta',
    icon: Sparkles,
  },
  enchanted_library: {
    name: 'Enchanted Library',
    storiesPerMonth: 60,
    premiumVoices: 60,
    color: 'amari-rose',
    icon: Crown,
  },
}

interface SubscriptionData {
  tier: keyof typeof TIER_CONFIG
  status: string
  storiesUsed: number
  storiesLimit: number
  premiumVoicesUsed: number
  premiumVoicesLimit: number
  currentPeriodEnd: string | null
  isOnTrial: boolean
  trialEnd: string | null
  trialDaysRemaining: number
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStories: 0,
    thisMonth: 0,
  })
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    status: 'free',
    storiesUsed: 0,
    storiesLimit: 3,
    premiumVoicesUsed: 0,
    premiumVoicesLimit: 0,
    currentPeriodEnd: null,
    isOnTrial: false,
    trialEnd: null,
    trialDaysRemaining: 0,
  })
  const [recentStories, setRecentStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        // First, sync user and check subscription status
        await fetch('/api/sync-user', { method: 'POST' })

        // Check subscription FIRST before loading any dashboard data
        const subscriptionResponse = await fetch('/api/subscriptions')

        if (subscriptionResponse.ok) {
          const subData = await subscriptionResponse.json()

          // If user requires subscription (no active plan), redirect to pricing immediately
          if (subData.requiresSubscription) {
            router.replace('/pricing?onboarding=true')
            return // Don't load anything else
          }

          // User has subscription - now load dashboard data
          setIsCheckingSubscription(false)

          setSubscription({
            tier: subData.tier || 'free',
            status: subData.status || 'free',
            storiesUsed: subData.storiesUsed || 0,
            storiesLimit: subData.limits?.storiesPerMonth || 3,
            premiumVoicesUsed: subData.premiumVoicesUsed || 0,
            premiumVoicesLimit: subData.limits?.premiumVoicesPerMonth || 0,
            currentPeriodEnd: subData.currentPeriodEnd || null,
            isOnTrial: subData.isOnTrial || false,
            trialEnd: subData.trialEnd || null,
            trialDaysRemaining: subData.trialDaysRemaining || 0,
          })

          // Now load stories
          const storiesResponse = await fetch('/api/stories')
          if (storiesResponse.ok) {
            const data = await storiesResponse.json()
            const stories = data.stories || []
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            const monthStories = stories.filter((story: any) =>
              new Date(story.created_at) >= startOfMonth
            )

            setStats({
              totalStories: stories.length,
              thisMonth: monthStories.length,
            })
            setRecentStories(stories.slice(0, 3))
          }
        } else {
          // If subscription fetch fails, redirect to pricing
          router.replace('/pricing?onboarding=true')
          return
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        // On error, redirect to pricing as a fallback
        router.replace('/pricing?onboarding=true')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, router])

  // Show minimal loading while checking subscription (no dashboard hints)
  if (isCheckingSubscription || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amari-cream">
        <div className="text-center">
          <Image
            src="/logo.svg"
            alt="Amari"
            width={160}
            height={53}
            className="h-12 w-auto mx-auto mb-6 animate-pulse"
          />
          <p className="text-amari-muted text-lg">Setting up your experience...</p>
        </div>
      </div>
    )
  }

  const tierConfig = TIER_CONFIG[subscription.tier] || TIER_CONFIG.free
  const TierIcon = tierConfig.icon
  const storiesRemaining = Math.max(0, subscription.storiesLimit - subscription.storiesUsed)
  const voicesRemaining = Math.max(0, subscription.premiumVoicesLimit - subscription.premiumVoicesUsed)
  const isLowOnStories = storiesRemaining <= 2 && subscription.tier !== 'enchanted_library'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-display font-semibold text-amari-charcoal mb-4">
          Welcome back, {user?.firstName || 'Storyteller'}!
        </h1>
        <p className="text-lg text-amari-muted">
          Ready to create more magical bedtime stories?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Stories This Month - Usage Card */}
        <Card className="bg-amari-sage/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amari-muted mb-1">Stories This Month</p>
                <p className="text-3xl font-display font-semibold text-amari-charcoal">
                  {subscription.storiesUsed}
                  <span className="text-lg font-normal text-amari-muted">/{subscription.storiesLimit}</span>
                </p>
              </div>
              <BookOpen className="h-10 w-10 text-amari-sage" />
            </div>
            <div className="mt-3">
              <div className="w-full bg-amari-sand rounded-full h-2">
                <div
                  className="bg-amari-sage h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subscription.storiesUsed / subscription.storiesLimit) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-amari-muted mt-1">{storiesRemaining} stories remaining</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amari-muted mb-1">Total Stories</p>
                <p className="text-3xl font-display font-semibold text-amari-charcoal">{stats.totalStories}</p>
              </div>
              <BookOpen className="h-10 w-10 text-amari-muted" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amari-muted mb-1">Premium Voices</p>
                <p className="text-3xl font-display font-semibold text-amari-charcoal">
                  {subscription.premiumVoicesUsed}
                  <span className="text-lg font-normal text-amari-muted">/{subscription.premiumVoicesLimit}</span>
                </p>
              </div>
              <Mic className="h-10 w-10 text-amari-terracotta" />
            </div>
          </CardContent>
        </Card>

        <Card className={subscription.tier !== 'free' ? 'bg-amari-rose/20' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amari-muted mb-1">Your Plan</p>
                <p className="text-2xl font-display font-semibold text-amari-charcoal">
                  {tierConfig.name}
                </p>
              </div>
              <TierIcon className={`h-10 w-10 ${subscription.tier !== 'free' ? 'text-amari-terracotta' : 'text-amari-muted'}`} />
            </div>
            {subscription.tier === 'free' && (
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trial Status Banner */}
      {subscription.isOnTrial && (
        <Card className="bg-amari-sage/10 border-amari-sage/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-full">
                  <Clock className="h-8 w-8 text-amari-sage" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-amari-charcoal">
                    {subscription.trialDaysRemaining} days left in your free trial
                  </h3>
                  <p className="text-amari-muted">
                    You're enjoying {tierConfig.name} features. Your trial ends{' '}
                    {subscription.trialEnd
                      ? new Date(subscription.trialEnd).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'soon'}
                    .
                  </p>
                </div>
              </div>
              <Link href="/settings/subscription">
                <Button variant="outline">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stories Warning / Upgrade Banner */}
      {isLowOnStories && !subscription.isOnTrial && (
        <Card className="bg-amari-terracotta text-white border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-semibold mb-2">
                  {storiesRemaining === 0 ? "You've Used All Your Stories!" : "Running Low on Stories"}
                </h3>
                <p className="text-white/80 mb-4">
                  {storiesRemaining === 0
                    ? "Upgrade your plan to continue creating magical bedtime stories."
                    : `You have ${storiesRemaining} ${storiesRemaining === 1 ? 'story' : 'stories'} remaining this month. Upgrade for more!`
                  }
                </p>
                <Link href="/pricing">
                  <Button className="bg-white text-amari-terracotta hover:bg-white/90">
                    View Plans <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <Sparkles className="h-16 w-16 text-white/30" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gift Banner - Show for all users */}
      <Card className="bg-amari-rose/20 border-amari-rose/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gift className="h-10 w-10 text-amari-terracotta" />
              <div>
                <h3 className="text-lg font-display font-semibold text-amari-charcoal">Give the Gift of Stories</h3>
                <p className="text-amari-muted">Perfect for grandparents, aunts, uncles & friends!</p>
              </div>
            </div>
            <Link href="/gifts">
              <Button variant="outline">
                Shop Gifts <Gift className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/create">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amari-charcoal">
                <Sparkles className="h-6 w-6 text-amari-terracotta" />
                Create New Story
              </CardTitle>
              <CardDescription className="text-amari-muted">
                Start a magical bedtime adventure
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/stories">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amari-charcoal">
                <BookOpen className="h-6 w-6 text-amari-sage" />
                My Stories
              </CardTitle>
              <CardDescription className="text-amari-muted">
                View and replay your saved stories
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Stories */}
      {recentStories.length > 0 && (
        <div>
          <h2 className="text-3xl font-display font-semibold text-amari-charcoal mb-6">
            Recent Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {recentStories.map((story) => (
              <Link key={story.id} href={`/stories/${story.id}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">
                        {story.tone === 'bedtime-calm' ? '🌙' : story.tone === 'funny' ? '😄' : story.tone === 'adventure' ? '🗺️' : '🔍'}
                      </span>
                      <span className="text-xs text-amari-muted">
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 text-amari-charcoal">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="text-amari-muted">
                      {story.word_count} words • {Math.ceil(story.word_count / 150)} min read
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentStories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-display font-semibold text-amari-charcoal mb-2">
              No Stories Yet
            </h3>
            <p className="text-amari-muted mb-6">
              Create your first magical bedtime story!
            </p>
            <Link href="/create">
              <Button size="lg">
                Create Your First Story <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
