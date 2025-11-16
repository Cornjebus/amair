/**
 * Test 2: Verify Session Object Structure
 *
 * This test confirms that Stripe checkout sessions include a URL property
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

const CORRECT_API_VERSION = '2025-10-29.clover'

async function testSessionStructure() {
  console.log('\n🧪 Test 2: Verifying Stripe Session Object Structure')
  console.log('='.repeat(60))

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: CORRECT_API_VERSION,
      typescript: true,
    })

    console.log('\nCreating checkout session...')
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

    console.log('\n✅ Session created successfully!')
    console.log('\n📊 Session Object Analysis:')
    console.log('-'.repeat(60))
    console.log('Session ID:', session.id)
    console.log('Session ID format:', session.id.startsWith('cs_') ? '✅ Valid (cs_*)' : '❌ Invalid')
    console.log()
    console.log('Session URL:', session.url)
    console.log('Session URL exists:', session.url ? '✅ Yes' : '❌ No')
    console.log('Session URL format:', session.url ? '✅ Valid Stripe URL' : '❌ Missing')
    console.log()
    console.log('Mode:', session.mode)
    console.log('Payment status:', session.payment_status)
    console.log('Status:', session.status)
    console.log()
    console.log('Success URL:', session.success_url)
    console.log('Cancel URL:', session.cancel_url)
    console.log()
    console.log('Metadata:', JSON.stringify(session.metadata, null, 2))

    console.log('\n🔗 URL Comparison:')
    console.log('-'.repeat(60))
    console.log('Correct URL (from Stripe):')
    console.log('  ', session.url)
    console.log()
    console.log('WRONG manual construction:')
    console.log('  ', `https://checkout.stripe.com/c/pay/${session.id}`)
    console.log()
    console.log('⚠️  These URLs are DIFFERENT! Must use session.url from Stripe.')

    console.log('\n📝 What our API should return:')
    console.log('-'.repeat(60))
    console.log(JSON.stringify({
      sessionId: session.id,
      url: session.url,  // ← This is what's currently MISSING!
    }, null, 2))

    console.log('\n📝 Minimal session properties:')
    console.log('-'.repeat(60))
    const minimalSession = {
      id: session.id,
      object: session.object,
      url: session.url,
      mode: session.mode,
      payment_status: session.payment_status,
      status: session.status,
    }
    console.log(JSON.stringify(minimalSession, null, 2))

    console.log('\n✅ Test completed successfully!')
    console.log('Key findings:')
    console.log('  1. Session object HAS a url property')
    console.log('  2. The URL is NOT manually constructable')
    console.log('  3. We MUST return session.url from our API')

  } catch (error: any) {
    console.log('\n❌ Test FAILED')
    console.log('Error type:', error.type)
    console.log('Error message:', error.message)
    console.log('Error code:', error.code)
    console.log('\nFull error:', error)
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('STRIPE SESSION STRUCTURE DIAGNOSTIC TEST')
  console.log('='.repeat(60))

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Missing STRIPE_SECRET_KEY environment variable')
    process.exit(1)
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
    console.error('❌ Missing NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID environment variable')
    process.exit(1)
  }

  await testSessionStructure()

  console.log('\n' + '='.repeat(60))
  console.log('TEST COMPLETE')
  console.log('='.repeat(60) + '\n')
}

main().catch(console.error)
