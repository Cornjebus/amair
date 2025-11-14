'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, BookOpen, Zap, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardPage() {
  const { user } = useUser()
  const [stats, setStats] = useState({
    totalStories: 0,
    thisMonth: 0,
    subscriptionStatus: 'free',
  })
  const [recentStories, setRecentStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        // Sync user and get stories via API
        await fetch('/api/sync-user', { method: 'POST' })

        const response = await fetch('/api/stories')
        const data = await response.json()

        if (response.ok) {
          const stories = data.stories || []
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const monthStories = stories.filter((story: any) =>
            new Date(story.created_at) >= startOfMonth
          )

          // Get user subscription status via sync-user
          const userResponse = await fetch('/api/sync-user', { method: 'POST' })
          const userData = await userResponse.json()

          setStats({
            totalStories: stories.length,
            thisMonth: monthStories.length,
            subscriptionStatus: userData.user?.subscription_status || 'free',
          })
          setRecentStories(stories.slice(0, 3))
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow animate-flutter mx-auto mb-4">
            <span className="text-4xl">🦋</span>
          </div>
          <p className="text-lavender-600">Loading your stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-5xl font-playfair font-bold text-lavender-900 mb-4">
          Welcome back, {user?.firstName || 'Storyteller'}! 🦋
        </h1>
        <p className="text-lg text-lavender-600">
          Ready to create more magical bedtime stories?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lavender-600 mb-1">Total Stories</p>
                <p className="text-3xl font-bold text-lavender-900">{stats.totalStories}</p>
              </div>
              <BookOpen className="h-10 w-10 text-lavender-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lavender-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-lavender-900">{stats.thisMonth}</p>
              </div>
              <Zap className="h-10 w-10 text-skyblue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-lavender-600 mb-1">Plan</p>
                <p className="text-2xl font-bold text-lavender-900 capitalize">
                  {stats.subscriptionStatus}
                </p>
              </div>
              <Crown className={`h-10 w-10 ${stats.subscriptionStatus === 'premium' ? 'text-yellow-400' : 'text-lavender-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Banner for Free Users */}
      {stats.subscriptionStatus === 'free' && (
        <Card className="bg-gradient-to-r from-lavender-500 to-skyblue-500 text-white border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-playfair font-bold mb-2">
                  Unlock Unlimited Stories
                </h3>
                <p className="text-lavender-50 mb-4">
                  Free users: {stats.thisMonth}/3 stories this month
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
                        }),
                      })
                      const data = await response.json()
                      if (data.sessionId) {
                        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`
                      }
                    } catch (error) {
                      console.error('Error creating checkout:', error)
                    }
                  }}
                >
                  Upgrade to Premium <Crown className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="text-6xl animate-flutter">🦋</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-xl transition-shadow cursor-pointer">
          <Link href="/create">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-lavender-600" />
                Create New Story
              </CardTitle>
              <CardDescription>
                Start a magical bedtime adventure
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-xl transition-shadow cursor-pointer">
          <Link href="/stories">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-skyblue-600" />
                My Stories
              </CardTitle>
              <CardDescription>
                View and replay your saved stories
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Stories */}
      {recentStories.length > 0 && (
        <div>
          <h2 className="text-3xl font-playfair font-bold text-lavender-900 mb-6">
            Recent Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {recentStories.map((story) => (
              <Link key={story.id} href={`/stories/${story.id}`}>
                <Card className="hover:shadow-xl transition-all hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">
                        {story.tone === 'bedtime-calm' ? '🌙' : story.tone === 'funny' ? '😄' : story.tone === 'adventure' ? '🗺️' : '🔍'}
                      </span>
                      <span className="text-xs text-lavender-600">
                        {new Date(story.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {story.title}
                    </CardTitle>
                    <CardDescription>
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
            <h3 className="text-2xl font-playfair font-bold text-lavender-900 mb-2">
              No Stories Yet
            </h3>
            <p className="text-lavender-600 mb-6">
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
