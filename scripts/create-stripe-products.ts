#!/usr/bin/env tsx
/**
 * Script to create Stripe products and prices for Amari subscription tiers
 * Run with: npx tsx scripts/create-stripe-products.ts
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

const tiers = [
  {
    name: 'Dream Weaver',
    description: 'Perfect for occasional storytellers - 10 magical stories every month with 3 premium voices',
    metadata: { tier: 'dream_weaver' },
    prices: [
      { amount: 699, interval: 'month' as const, nickname: 'Dream Weaver Monthly' },
      { amount: 5999, interval: 'year' as const, nickname: 'Dream Weaver Annual' },
    ],
  },
  {
    name: 'Magic Circle',
    description: 'For dedicated families - 30 stories monthly with 15 premium voices, family sharing, and more',
    metadata: { tier: 'magic_circle' },
    prices: [
      { amount: 1499, interval: 'month' as const, nickname: 'Magic Circle Monthly' },
      { amount: 11999, interval: 'year' as const, nickname: 'Magic Circle Annual' },
    ],
  },
  {
    name: 'Enchanted Library',
    description: 'Ultimate storytelling experience - 60 stories monthly, unlimited voices, custom themes, and priority support',
    metadata: { tier: 'enchanted_library' },
    prices: [
      { amount: 2999, interval: 'month' as const, nickname: 'Enchanted Library Monthly' },
      { amount: 24999, interval: 'year' as const, nickname: 'Enchanted Library Annual' },
    ],
  },
]

async function createProducts() {
  console.log('🎨 Creating Stripe products and prices...\n')

  const results: Record<string, { productId: string; prices: Record<string, string> }> = {}

  for (const tier of tiers) {
    console.log(`📦 Creating product: ${tier.name}`)

    try {
      // Create product
      const product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: tier.metadata,
      })

      console.log(`✅ Product created: ${product.id}`)

      results[tier.metadata.tier] = {
        productId: product.id,
        prices: {},
      }

      // Create prices
      for (const price of tier.prices) {
        const priceObj = await stripe.prices.create({
          product: product.id,
          unit_amount: price.amount,
          currency: 'usd',
          recurring: {
            interval: price.interval,
          },
          nickname: price.nickname,
          metadata: {
            tier: tier.metadata.tier,
            interval: price.interval,
          },
        })

        results[tier.metadata.tier].prices[price.interval] = priceObj.id
        console.log(`  ✅ ${price.interval} price: ${priceObj.id} ($${price.amount / 100})`)
      }

      console.log()
    } catch (error: any) {
      console.error(`❌ Error creating ${tier.name}:`, error.message)
    }
  }

  // Print environment variable format
  console.log('\n📋 Add these to your .env.local and Vercel:\n')
  console.log('# Dream Weaver Tier')
  console.log(`NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY=${results.dream_weaver?.prices.month || ''}`)
  console.log(`NEXT_PUBLIC_STRIPE_DREAM_WEAVER_ANNUAL=${results.dream_weaver?.prices.year || ''}`)
  console.log('\n# Magic Circle Tier')
  console.log(`NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_MONTHLY=${results.magic_circle?.prices.month || ''}`)
  console.log(`NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL=${results.magic_circle?.prices.year || ''}`)
  console.log('\n# Enchanted Library Tier')
  console.log(`NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_MONTHLY=${results.enchanted_library?.prices.month || ''}`)
  console.log(`NEXT_PUBLIC_STRIPE_ENCHANTED_LIBRARY_ANNUAL=${results.enchanted_library?.prices.year || ''}`)
  console.log('\n✨ Done! Copy these values to your .env.local file.')
}

createProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
