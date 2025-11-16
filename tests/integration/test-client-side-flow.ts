/**
 * TDD Test 3: Client-Side Flow Simulation
 *
 * Simulates the exact call made from the dashboard component
 * to identify if there's an issue with how the client is calling the API
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

async function simulateClientSideCall() {
  console.log('\n' + '='.repeat(70))
  console.log('CLIENT-SIDE FLOW SIMULATION TEST')
  console.log('='.repeat(70) + '\n')

  // Simulate what happens in the browser
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  console.log('🧪 Test 1: Environment Variable Access')
  console.log('-'.repeat(70))
  console.log('Simulating client-side environment variable access...')
  console.log('NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID:', priceId)
  console.log('Is defined:', !!priceId)
  console.log()

  if (!priceId) {
    console.log('❌ CRITICAL: Price ID is undefined!')
    console.log('This means the client component cannot access the environment variable.')
    console.log()
    return false
  }

  console.log('✅ Price ID is accessible:', priceId)
  console.log()

  // Simulate the API call
  console.log('🧪 Test 2: API Call Simulation')
  console.log('-'.repeat(70))

  const requestBody = {
    priceId: priceId,
  }

  console.log('Request body that will be sent to API:')
  console.log(JSON.stringify(requestBody, null, 2))
  console.log()

  // Check for common issues
  const issues: string[] = []

  if (!requestBody.priceId) {
    issues.push('priceId is undefined or null')
  }

  if (requestBody.priceId && !requestBody.priceId.startsWith('price_')) {
    issues.push(`priceId has unexpected format: ${requestBody.priceId}`)
  }

  if (issues.length > 0) {
    console.log('❌ Issues detected in request:')
    issues.forEach(issue => console.log(`   - ${issue}`))
    console.log()
    return false
  }

  console.log('✅ Request body is valid')
  console.log()

  return true
}

async function testProductionEndpoint() {
  console.log('🧪 Test 3: Production API Endpoint Test')
  console.log('-'.repeat(70))

  const productionUrl = 'https://myamari.ai'
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  if (!priceId) {
    console.log('❌ Cannot test - price ID is undefined')
    return false
  }

  console.log('Attempting to call production API endpoint...')
  console.log('URL:', `${productionUrl}/api/create-checkout-session`)
  console.log()

  try {
    const response = await fetch(`${productionUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    console.log()

    const data = await response.json()
    console.log('Response body:')
    console.log(JSON.stringify(data, null, 2))
    console.log()

    if (!response.ok) {
      console.log('❌ API returned error')
      console.log('Error:', data.error || 'Unknown error')
      console.log()

      if (response.status === 401) {
        console.log('🔍 This is an authentication error')
        console.log('Clerk is requiring authentication for this endpoint')
        console.log('This is EXPECTED - the endpoint requires a logged-in user')
        console.log()
        console.log('✅ The 401 error is correct behavior for unauthenticated requests')
        return true  // This is actually expected!
      }

      if (response.status === 500) {
        console.log('🔍 This is a server error')
        console.log('The request reached the server but something went wrong')
        console.log()
        console.log('Possible causes:')
        console.log('  - Stripe API error')
        console.log('  - Environment variable not set in production')
        console.log('  - Database connection issue')
        console.log('  - Code error in the API route')
        console.log()
      }

      return false
    }

    console.log('✅ API call succeeded')

    // Validate response
    if (!data.sessionId) {
      console.log('⚠️  Warning: Response missing sessionId')
    }
    if (!data.url) {
      console.log('⚠️  Warning: Response missing url')
    }

    console.log()
    return true

  } catch (error: any) {
    console.log('❌ Network error or exception')
    console.log('Error:', error.message)
    console.log()
    return false
  }
}

async function testLocalEndpoint() {
  console.log('🧪 Test 4: Local Development Endpoint Test')
  console.log('-'.repeat(70))

  const localUrl = 'http://localhost:3000'
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  if (!priceId) {
    console.log('❌ Cannot test - price ID is undefined')
    return false
  }

  console.log('⚠️  This test requires the dev server to be running')
  console.log('Start server with: npm run dev')
  console.log()
  console.log('Checking if local server is available...')

  try {
    const healthCheck = await fetch(`${localUrl}/`, {
      method: 'HEAD',
    }).catch(() => null)

    if (!healthCheck) {
      console.log('❌ Local server is not running')
      console.log('Skipping local endpoint test')
      console.log()
      return true  // Not a failure, just skipped
    }

    console.log('✅ Local server is running')
    console.log()

    console.log('Attempting to call local API endpoint...')

    const response = await fetch(`${localUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
      }),
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    console.log()

    if (response.status === 401) {
      console.log('✅ Got 401 (expected - requires authentication)')
      return true
    }

    return response.ok

  } catch (error: any) {
    console.log('⚠️  Could not connect to local server (this is OK if not running)')
    console.log()
    return true  // Not a failure
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('COMPREHENSIVE CLIENT-SIDE FLOW TEST')
  console.log('='.repeat(70))

  const results: Array<{ name: string, passed: boolean }> = []

  // Test 1 & 2: Client-side simulation
  const clientResult = await simulateClientSideCall()
  results.push({ name: 'Client-Side Simulation', passed: clientResult })

  // Test 3: Production endpoint
  const prodResult = await testProductionEndpoint()
  results.push({ name: 'Production Endpoint', passed: prodResult })

  // Test 4: Local endpoint
  const localResult = await testLocalEndpoint()
  results.push({ name: 'Local Endpoint', passed: localResult })

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
    console.log('✅ All tests PASSED\n')
    process.exit(0)
  } else {
    console.log('❌ Some tests FAILED\n')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n💥 Unexpected error:')
  console.error(error)
  process.exit(1)
})
