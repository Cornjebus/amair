/**
 * Stripe Configuration
 *
 * Client-side Stripe configuration that will be bundled into the build
 */

// These are public, non-secret values that can be safely exposed to the client
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || '',
  yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || '',
} as const

// Validate configuration at build time
if (typeof window === 'undefined') {
  // Server-side validation
  const missing: string[] = []

  if (!STRIPE_CONFIG.publishableKey) {
    missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  }
  if (!STRIPE_CONFIG.monthlyPriceId) {
    missing.push('NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID')
  }

  if (missing.length > 0) {
    console.warn(`[Stripe Config] Missing environment variables: ${missing.join(', ')}`)
  }
}

export default STRIPE_CONFIG
