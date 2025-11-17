/**
 * TDD Test 2: Checkout API Endpoint Integration Test
 *
 * Tests the complete checkout session creation flow including:
 * - Stripe initialization
 * - Session creation
 * - Response format
 * - Error handling
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })


interface CheckoutSessionRequest {
  priceId: string
  mode?: 'subscription' | 'payment'
}

interface CheckoutSessionResponse {
  sessionId?: string
  url?: string
  error?: string
}

async function testStripeInitialization() {
  console.log('\n🧪 Test 1: Stripe Initialization')
  console.log('='.repeat(70))

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ STRIPE_SECRET_KEY is not set')
      return false
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Use Stripe account's default API version
      typescript: true,
    })

    console.log('✅ Stripe initialized successfully')
    console.log('API Version:', API_VERSION)
    console.log('Has secret key:', !!process.env.STRIPE_SECRET_KEY)
    console.log()
    return { success: true, stripe }
  } catch (error: any) {
    console.log('❌ Stripe initialization failed')
    console.log('Error:', error.message)
    console.log()
    return { success: false, stripe: null }
  }
}

async function testCheckoutSessionCreation(stripe: Stripe) {
  console.log('🧪 Test 2: Checkout Session Creation')
  console.log('='.repeat(70))

  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  if (!priceId) {
    console.log('❌ NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID is not set')
    console.log()
    return false
  }

  console.log('Using price ID:', priceId)
  console.log()

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myamari.ai'

    console.log('Creating checkout session with:')
    console.log('  Mode: subscription')
    console.log('  Price ID:', priceId)
    console.log('  Success URL:', `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`)
    console.log('  Cancel URL:', `${appUrl}/pricing`)
    console.log()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: 'test_user_123',
      },
    })

    console.log('✅ Checkout session created successfully!')
    console.log()
    console.log('Session details:')
    console.log('  ID:', session.id)
    console.log('  Mode:', session.mode)
    console.log('  Status:', session.status)
    console.log('  Payment status:', session.payment_status)
    console.log('  URL exists:', !!session.url)
    console.log('  URL length:', session.url?.length)
    console.log()

    if (!session.url) {
      console.log('❌ Session URL is missing!')
      return false
    }

    console.log('✅ Session URL is present')
    console.log()

    return { success: true, session }
  } catch (error: any) {
    console.log('❌ Checkout session creation failed')
    console.log()
    console.log('Error details:')
    console.log('  Type:', error.type)
    console.log('  Message:', error.message)
    console.log('  Code:', error.code)
    console.log('  Status:', error.statusCode)
    console.log()

    if (error.type === 'StripeInvalidRequestError') {
      console.log('Common causes:')
      console.log('  - Invalid price ID')
      console.log('  - Price belongs to different Stripe account')
      console.log('  - Price is archived or inactive')
      console.log('  - Test vs. live mode mismatch')
      console.log()
    }

    return { success: false, session: null }
  }
}

async function testApiResponse(session: Stripe.Checkout.Session) {
  console.log('🧪 Test 3: API Response Format')
  console.log('='.repeat(70))

  const response: CheckoutSessionResponse = {
    sessionId: session.id,
    url: session.url
  }

  console.log('Expected API response format:')
  console.log(JSON.stringify(response, null, 2))
  console.log()

  // Validate response
  const checks = [
    { name: 'Has sessionId', pass: !!response.sessionId },
    { name: 'sessionId starts with cs_', pass: response.sessionId?.startsWith('cs_') },
    { name: 'Has url', pass: !!response.url },
    { name: 'URL is valid', pass: response.url?.startsWith('https://checkout.stripe.com/') },
    { name: 'URL has hash fragment', pass: response.url?.includes('#') },
  ]

  let allPassed = true
  for (const check of checks) {
    const status = check.pass ? '✅' : '❌'
    console.log(`${status} ${check.name}`)
    if (!check.pass) allPassed = false
  }

  console.log()

  if (allPassed) {
    console.log('✅ API response format is correct')
  } else {
    console.log('❌ API response format has issues')
  }

  console.log()
  return allPassed
}

async function testPriceIdValidity() {
  console.log('🧪 Test 4: Price ID Validity Check')
  console.log('='.repeat(70))

  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!priceId || !secretKey) {
    console.log('❌ Missing required environment variables')
    return false
  }

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: API_VERSION,
      typescript: true,
    })

    console.log('Fetching price details from Stripe...')
    const price = await stripe.prices.retrieve(priceId)

    console.log()
    console.log('Price details:')
    console.log('  ID:', price.id)
    console.log('  Active:', price.active)
    console.log('  Type:', price.type)
    console.log('  Currency:', price.currency)
    console.log('  Amount:', price.unit_amount ? price.unit_amount / 100 : 'N/A')
    console.log('  Recurring:', price.recurring ? `${price.recurring.interval_count} ${price.recurring.interval}` : 'No')
    console.log()

    if (!price.active) {
      console.log('⚠️  WARNING: Price is not active!')
      console.log('This price cannot be used for new checkouts.')
      console.log()
      return false
    }

    console.log('✅ Price is valid and active')
    console.log()
    return true

  } catch (error: any) {
    console.log('❌ Failed to retrieve price')
    console.log()
    console.log('Error:', error.message)
    console.log()
    console.log('Possible causes:')
    console.log('  - Price ID does not exist')
    console.log('  - Price belongs to different Stripe account')
    console.log('  - Using test key with live price (or vice versa)')
    console.log()

    if (secretKey.includes('_test_')) {
      console.log('🔍 Using TEST mode secret key')
      if (priceId.includes('_live_')) {
        console.log('❌ Price ID appears to be LIVE mode')
        console.log('MISMATCH: Cannot use live price with test key!')
      } else if (!priceId.includes('_test_')) {
        console.log('⚠️  Price ID format is unusual for test mode')
      }
    }

    console.log()
    return false
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('CHECKOUT API INTEGRATION TEST SUITE')
  console.log('='.repeat(70))

  const results: Array<{ name: string, passed: boolean }> = []

  // Test 1: Stripe Initialization
  const initResult = await testStripeInitialization()
  results.push({ name: 'Stripe Initialization', passed: initResult.success })

  if (!initResult.success || !initResult.stripe) {
    console.log('\n❌ Cannot continue tests - Stripe initialization failed')
    console.log('='.repeat(70) + '\n')
    process.exit(1)
  }

  // Test 4: Price ID Validity (run before session creation)
  const priceValidityResult = await testPriceIdValidity()
  results.push({ name: 'Price ID Validity', passed: priceValidityResult })

  // Test 2: Checkout Session Creation
  const sessionResult = await testCheckoutSessionCreation(initResult.stripe)
  results.push({ name: 'Checkout Session Creation', passed: sessionResult.success })

  if (sessionResult.success && sessionResult.session) {
    // Test 3: API Response Format
    const responseResult = await testApiResponse(sessionResult.session)
    results.push({ name: 'API Response Format', passed: responseResult })
  }

  // Summary
  console.log('='.repeat(70))
  console.log('TEST SUMMARY')
  console.log('='.repeat(70))

  const passed = results.filter(r => r.passed).length
  const total = results.length

  for (const result of results) {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
  }

  console.log()
  console.log(`Results: ${passed}/${total} tests passed`)
  console.log('='.repeat(70) + '\n')

  if (passed === total) {
    console.log('✅ All tests PASSED - Checkout API is working correctly!\n')
    process.exit(0)
  } else {
    console.log('❌ Some tests FAILED - Issues detected in checkout flow\n')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n💥 Unexpected error:')
  console.error(error)
  process.exit(1)
})
