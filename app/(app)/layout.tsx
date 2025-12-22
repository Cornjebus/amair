'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown, Star, Sparkles, BookOpen, Settings } from 'lucide-react'
import { CombinedToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ConfirmationProvider } from '@/hooks/useConfirmation'
import { SkipLink, SkipLinkTarget } from '@/components/accessibility'
import { LogoInline } from '@/components/ui/Logo'

// Tier display configuration with new Amari colors
const TIER_DISPLAY = {
  free: { name: 'Free', icon: BookOpen, color: 'text-amari-muted', bg: 'bg-amari-sand' },
  dream_weaver: { name: 'Dream Weaver', icon: Star, color: 'text-amari-sage', bg: 'bg-amari-sage/10' },
  magic_circle: { name: 'Magic Circle', icon: Sparkles, color: 'text-amari-terracotta', bg: 'bg-amari-terracotta/10' },
  enchanted_library: { name: 'Enchanted Library', icon: Crown, color: 'text-amari-rose', bg: 'bg-amari-rose/30' },
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
    <CombinedToastProvider position="bottom-right">
    <ConfirmationProvider>
      <SkipLink href="#main-content" />
      <div className="min-h-screen bg-amari-cream">
        <header className="sticky top-0 z-50 w-full border-b border-amari-sand bg-amari-cream/95 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between px-4">
            <LogoInline size="md" linkTo="/dashboard" />

            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-amari-charcoal border-b-2 border-amari-terracotta'
                    : 'text-amari-muted hover:text-amari-charcoal'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className={`text-sm font-medium transition-colors ${
                  isActive('/create')
                    ? 'text-amari-charcoal border-b-2 border-amari-terracotta'
                    : 'text-amari-muted hover:text-amari-charcoal'
                }`}
              >
                Create Story
              </Link>
              <Link
                href="/stories"
                className={`text-sm font-medium transition-colors ${
                  isActive('/stories')
                    ? 'text-amari-charcoal border-b-2 border-amari-terracotta'
                    : 'text-amari-muted hover:text-amari-charcoal'
                }`}
              >
                My Stories
              </Link>

              {/* Subscription Badge */}
              <Link
                href="/pricing"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tierInfo.bg} hover:opacity-80 transition-opacity`}
              >
                <TierIcon className={`h-4 w-4 ${tierInfo.color}`} />
                {subscription ? (
                  <>
                    <span className={`text-sm font-semibold ${tierInfo.color} tabular-nums`}>
                      {subscription.storiesRemaining}
                    </span>
                    <span className="text-xs text-amari-muted">stories left</span>
                  </>
                ) : (
                  <span className="text-xs text-amari-muted">...</span>
                )}
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className={`p-2 rounded-lg transition-colors ${
                  pathname?.startsWith('/settings')
                    ? 'bg-amari-terracotta/10 text-amari-terracotta'
                    : 'text-amari-muted hover:text-amari-charcoal hover:bg-amari-sand/50'
                }`}
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>

              <UserButton afterSignOutUrl="/" />
            </nav>
          </div>
        </header>

        <SkipLinkTarget id="main-content" className="container mx-auto px-4 py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </SkipLinkTarget>
      </div>
    </ConfirmationProvider>
    </CombinedToastProvider>
  )
}
