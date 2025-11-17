import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  // Clean the secret key - remove any whitespace, newlines, or escape sequences
  const cleanSecretKey = secretKey
    .replace(/\\n/g, '') // Remove literal \n
    .replace(/\n/g, '')  // Remove actual newlines
    .replace(/\r/g, '')  // Remove carriage returns
    .trim()              // Remove leading/trailing whitespace

  if (!cleanSecretKey.startsWith('sk_')) {
    throw new Error('Invalid STRIPE_SECRET_KEY format after cleaning')
  }

  stripeInstance = new Stripe(cleanSecretKey, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  })

  return stripeInstance
}

export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}
