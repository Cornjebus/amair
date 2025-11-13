import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
              className="text-sm font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="text-sm font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
            >
              Create Story
            </Link>
            <Link
              href="/stories"
              className="text-sm font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
            >
              My Stories
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-lavender-700 hover:text-lavender-900 transition-colors"
            >
              Pricing
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
