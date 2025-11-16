/**
 * Test 1: Validate Stripe API Version
 *
 * This test confirms that the current API version is causing failures
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const WRONG_API_VERSION = '2025-10-29.clover' as any
const CORRECT_API_VERSION = '2024-11-20'

async function testWrongApiVersion() {
  console.log('\n🧪 Test 1A: Testing WRONG API version:', WRONG_API_VERSION)
  console.log('=' .repeat(60))

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: WRONG_API_VERSION,
      typescript: true,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
        quantity: 1,
      }],
      success_url: 'https://myamari.ai/success',
      cancel_url: 'https://myamari.ai/cancel',
    })

    console.log('✅ API call SUCCEEDED (unexpected!)')
    console.log('Session ID:', session.id)
  } catch (error: any) {
    console.log('❌ API call FAILED (expected)')
    console.log('Error type:', error.type)
    console.log('Error message:', error.message)
    console.log('Error code:', error.code)
    console.log('\nThis confirms the API version is causing failures!')
  }
}

async function testCorrectApiVersion() {
  console.log('\n🧪 Test 1B: Testing CORRECT API version:', CORRECT_API_VERSION)
  console.log('='.repeat(60))

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: CORRECT_API_VERSION,
      typescript: true,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
        quantity: 1,
      }],
      success_url: 'https://myamari.ai/dashboard?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://myamari.ai/pricing',
      metadata: {
        clerk_user_id: 'test_user_123',
      },
    })

    console.log('✅ API call SUCCEEDED')
    console.log('Session ID:', session.id)
    console.log('Session URL exists:', !!session.url)
    console.log('Session URL:', session.url)
    console.log('\nThis confirms the correct API version works!')
  } catch (error: any) {
    console.log('❌ API call FAILED (unexpected!)')
    console.log('Error:', error.message)
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('STRIPE API VERSION DIAGNOSTIC TEST')
  console.log('='.repeat(60))

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Missing STRIPE_SECRET_KEY environment variable')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
    console.error('❌ Missing NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID environment variable')
    process.exit(1)
  }

  await testWrongApiVersion()
  await testCorrectApiVersion()

  console.log('\n' + '='.repeat(60))
  console.log('TEST COMPLETE')
  console.log('='.repeat(60) + '\n')
}

main().catch(console.error)
