'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown, Star, Sparkles, BookOpen } from 'lucide-react'

// Tier display configuration
const TIER_DISPLAY = {
  free: { name: 'Free', icon: BookOpen, color: 'text-gray-600', bg: 'bg-gray-100' },
  dream_weaver: { name: 'Dream Weaver', icon: Star, color: 'text-skyblue-600', bg: 'bg-skyblue-100' },
  magic_circle: { name: 'Magic Circle', icon: Sparkles, color: 'text-lavender-600', bg: 'bg-lavender-100' },
  enchanted_library: { name: 'Enchanted Library', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' },
}

interface SubscriptionInfo {
  tier: keyof typeof TIER_DISPLAY
  storiesRemaining: number
  storiesLimit: number
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions')
        if (response.ok) {
          const data = await response.json()
          setSubscription({
            tier: data.tier || 'free',
            storiesRemaining: Math.max(0, (data.limits?.storiesPerMonth || 3) - (data.storiesUsed || 0)),
            storiesLimit: data.limits?.storiesPerMonth || 3,
          })
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }
    fetchSubscription()
  }, [pathname]) // Refetch when route changes

  const isActive = (path: string) => pathname === path

  const tierInfo = subscription ? TIER_DISPLAY[subscription.tier] || TIER_DISPLAY.free : TIER_DISPLAY.free
  const TierIcon = tierInfo.icon

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-lavender-200 bg-white/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-lavender-400 to-skyblue-400 rounded-full flex items-center justify-center butterfly-glow">
              <span className="text-2xl">🦋</span>
            </div>
            <span className="font-playfair text-2xl font-bold text-lavender-900">
              Amari
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'text-lavender-900 border-b-2 border-lavender-500'
                  : 'text-lavender-700 hover:text-lavender-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className={`text-sm font-medium transition-colors ${
                isActive('/create')
                  ? 'text-lavender-900 border-b-2 border-lavender-500'
                  : 'text-lavender-700 hover:text-lavender-900'
              }`}
            >
              Create Story
            </Link>
            <Link
              href="/stories"
              className={`text-sm font-medium transition-colors ${
                isActive('/stories')
                  ? 'text-lavender-900 border-b-2 border-lavender-500'
                  : 'text-lavender-700 hover:text-lavender-900'
              }`}
            >
              My Stories
            </Link>

            {/* Subscription Badge */}
            <Link
              href="/pricing"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierInfo.bg} border border-${tierInfo.color.replace('text-', '')}/20 hover:opacity-80 transition-opacity`}
            >
              <TierIcon className={`h-4 w-4 ${tierInfo.color}`} />
              {subscription ? (
                <>
                  <span className={`text-sm font-semibold ${tierInfo.color} tabular-nums`}>
                    {subscription.storiesRemaining}
                  </span>
                  <span className="text-xs text-gray-500">stories left</span>
                </>
              ) : (
                <span className="text-xs text-gray-500">...</span>
              )}
            </Link>

            <UserButton afterSignOutUrl="/" />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
