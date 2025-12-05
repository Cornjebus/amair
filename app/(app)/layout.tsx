'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coins, Sparkles } from 'lucide-react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch('/api/credits')
        if (response.ok) {
          const data = await response.json()
          setCredits(data.balance)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      }
    }
    fetchCredits()
  }, [pathname]) // Refetch when route changes

  const isActive = (path: string) => pathname === path

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

            {/* Credit Badge */}
            <Link
              href="/credits"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-lavender-100 to-skyblue-100 border border-lavender-200 hover:border-lavender-300 transition-colors"
            >
              <Coins className="h-4 w-4 text-lavender-600" />
              <span className="text-sm font-semibold text-lavender-800 tabular-nums">
                {credits !== null ? credits.toLocaleString() : '...'}
              </span>
              <span className="text-xs text-lavender-600">credits</span>
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
