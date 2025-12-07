import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',           // Public: pricing page
  '/gifts(.*)',             // Public: gift purchase and redemption
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/gifts/packages(.*)', // Public: gift packages info
  '/api/gifts/redeem(.*)',   // Public: gift code validation (GET only)
  '/api/subscriptions/prices(.*)', // Public: subscription prices
])

export default clerkMiddleware((auth, request) => {
  const { userId } = auth()
  const isHomepage = request.nextUrl.pathname === '/'

  // Redirect logged-in users from homepage to dashboard
  if (userId && isHomepage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
