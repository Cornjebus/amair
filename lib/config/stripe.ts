/**
 * Stripe Configuration
 *
 * Client-side Stripe configuration that will be bundled into the build
 *
 * NOTE: These are PUBLIC values (publishable key and price IDs) that are
 * safe to expose to the client. They are not secrets.
 */

// Fallback values if environment variables aren't available
const FALLBACK_VALUES = {
  publishableKey: 'pk_test_51ST7SDKIw4Zz4xBRKSaqkNeG5CphE4u8HBnYhimx2gplj2EWSUWqcKA0x7N0GFxvzJysbqDs0swpJ6jHVmLQei2y000J5ZLuL8',
  monthlyPriceId: 'price_1STAXeKIw4Zz4xBRjPMSFJY8',
  yearlyPriceId: '',
}

// Helper to clean public env values (price IDs, publishable key) of stray whitespace/newlines
const cleanPublicValue = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .replace(/\\n/g, '') // Remove literal \n
    .replace(/\n/g, '')  // Remove actual newlines
    .replace(/\r/g, '')  // Remove carriage returns
    .trim()

// These are public, non-secret values that can be safely exposed to the client
export const STRIPE_CONFIG = {
  publishableKey: cleanPublicValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, FALLBACK_VALUES.publishableKey),
  monthlyPriceId: cleanPublicValue(process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID, FALLBACK_VALUES.monthlyPriceId),
  yearlyPriceId: cleanPublicValue(process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID, FALLBACK_VALUES.yearlyPriceId),
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
