/**
 * Debug Test: Production API Direct Call
 *
 * This simulates the exact call being made from the frontend
 * to identify the server-side error
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env.local') })

async function testProductionAPI() {
  console.log('\n' + '='.repeat(70))
  console.log('PRODUCTION API DEBUG TEST')
  console.log('='.repeat(70) + '\n')

  const url = 'https://amair-cqnv5v9mx-cornelius-s-projects.vercel.app/api/create-checkout-session'
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  console.log('Testing URL:', url)
  console.log('Price ID:', priceId)
  console.log()

  try {
    console.log('Sending POST request...')
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:')
    for (const [key, value] of response.headers.entries()) {
      if (key.includes('clerk') || key.includes('x-')) {
        console.log(`  ${key}: ${value}`)
      }
    }
    console.log()

    const responseText = await response.text()

    console.log('Response body (raw):')
    console.log(responseText)
    console.log()

    try {
      const data = JSON.parse(responseText)
      console.log('Response body (parsed):')
      console.log(JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('Response is not JSON')
    }

    console.log()

    // Analyze the error
    if (response.status === 401) {
      console.log('✅ Got 401 - This is EXPECTED (auth required)')
      console.log('The API endpoint exists and is working')
      console.log('It correctly requires authentication')
      return true
    }

    if (response.status === 500) {
      console.log('❌ Got 500 - SERVER ERROR')
      console.log('The API endpoint exists but something is failing')
      console.log()
      console.log('Possible causes:')
      console.log('  1. Stripe API key issue')
      console.log('  2. Environment variable missing in production')
      console.log('  3. Stripe API connection error')
      console.log('  4. Code error in the API route')
      console.log()

      // Try to parse error details
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.error) {
          console.log('Error message from API:', errorData.error)
        }
      } catch (e) {
        // Not JSON
      }

      return false
    }

    if (response.status === 404) {
      console.log('❌ Got 404 - API route not found')
      console.log('The deployment does not have this API route')
      return false
    }

    console.log('Unexpected status code:', response.status)
    return false

  } catch (error: any) {
    console.log('❌ Network error:')
    console.log(error.message)
    return false
  }
}

async function testWithDifferentPriceIds() {
  console.log('='.repeat(70))
  console.log('TESTING WITH DIFFERENT INPUTS')
  console.log('='.repeat(70) + '\n')

  const url = 'https://amair-cqnv5v9mx-cornelius-s-projects.vercel.app/api/create-checkout-session'

  const testCases = [
    { name: 'With valid price ID', priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID },
    { name: 'With undefined price ID', priceId: undefined },
    { name: 'With empty string', priceId: '' },
    { name: 'With null', priceId: null },
  ]

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`)
    console.log(`  Price ID: ${testCase.priceId}`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: testCase.priceId })
      })

      console.log(`  Status: ${response.status}`)

      const text = await response.text()
      if (text.length < 200) {
        console.log(`  Response: ${text}`)
      }

      console.log()
    } catch (error: any) {
      console.log(`  Error: ${error.message}`)
      console.log()
    }
  }
}

async function main() {
  const result = await testProductionAPI()

  if (!result) {
    console.log('\n⚠️  Main test failed, trying different inputs...\n')
    await testWithDifferentPriceIds()
  }

  console.log('\n' + '='.repeat(70))
  console.log('DEBUG TEST COMPLETE')
  console.log('='.repeat(70) + '\n')
}

main().catch(console.error)
