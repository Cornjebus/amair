import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Direct export with lazy initialization
// Don't initialize at module load time to avoid build-time errors
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    // Lazy initialize on first access
    const instance = getStripe()
    return (instance as any)[prop]
  }
})

export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_YEARLY_PRICE_ID,
}
