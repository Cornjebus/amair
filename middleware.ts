import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',           // Public: pricing page (need this for subscription flow)
  '/gifts(.*)',             // Public: gift purchase and redemption
  '/subscription/success(.*)', // Public: subscription success page
  '/api/webhooks(.*)',
  '/api/health(.*)',
  '/api/inngest(.*)',       // Public: Inngest webhook endpoint
  '/api/gifts/packages(.*)', // Public: gift packages info
  '/api/gifts/redeem(.*)',   // Public: gift code validation (GET only)
  '/api/subscriptions(.*)',  // Public: subscription endpoints (needed for checkout)
  '/api/voices(.*)',         // Public: voice options
  '/api/art-styles(.*)',     // Public: art style options
  '/api/credits/packages(.*)', // Public: credit package info
  '/api/sync-user(.*)',      // Public: user sync endpoint
])

// Routes that require an active subscription (trial or paid)
const isSubscriptionRequired = createRouteMatcher([
  '/dashboard(.*)',
  '/create(.*)',
  '/stories(.*)',
  '/settings(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = auth()
  const isHomepage = request.nextUrl.pathname === '/'
  const pathname = request.nextUrl.pathname

  // Redirect logged-in users from homepage to dashboard (which will check subscription)
  if (userId && isHomepage) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  if (!isPublicRoute(request)) {
    auth().protect()
  }

  // For subscription-required routes, we'll check subscription status client-side
  // The dashboard/create pages will redirect to pricing if no active subscription
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
