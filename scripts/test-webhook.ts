#!/usr/bin/env tsx
/**
 * Test webhook handler with simulated Stripe events
 * Run with: npx tsx scripts/test-webhook.ts
 */

import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const TEST_CLERK_USER_ID = 'user_test_webhook_12345'
const TEST_CUSTOMER_ID = 'cus_test_12345'

async function testWebhook(eventType: string, priceId: string) {
  console.log(`\n🧪 Testing ${eventType} with price ${priceId}...\n`)

  const event = {
    type: eventType,
    data: {
      object: {
        id: 'cs_test_12345',
        customer: TEST_CUSTOMER_ID,
        client_reference_id: TEST_CLERK_USER_ID,
        payment_status: 'paid',
        mode: 'subscription',
        subscription: 'sub_test_12345',
        amount_total: 699,
        currency: 'usd',
        line_items: {
          data: [
            {
              price: {
                id: priceId,
              },
            },
          ],
        },
      },
    },
  }

  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature', // In real test, use CLI
      },
      body: JSON.stringify(event),
    })

    const data = await response.json()
    console.log('Response:', response.status, data)
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Starting webhook tests...')
  console.log('⚠️  Make sure your dev server is running on localhost:3000\n')

  // Test Dream Weaver Monthly
  await testWebhook(
    'checkout.session.completed',
    process.env.NEXT_PUBLIC_STRIPE_DREAM_WEAVER_MONTHLY!
  )

  // Add delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test Magic Circle Annual
  await testWebhook(
    'checkout.session.completed',
    process.env.NEXT_PUBLIC_STRIPE_MAGIC_CIRCLE_ANNUAL!
  )

  console.log('\n✅ Tests complete!')
  console.log('\n💡 For production testing, use Stripe CLI:')
  console.log('   stripe listen --forward-to localhost:3000/api/webhooks/stripe')
  console.log('   stripe trigger checkout.session.completed')
}

runTests().catch(console.error)
