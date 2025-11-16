/**
 * TDD Test 1: Environment Variables Validation
 *
 * Tests that all required environment variables are properly configured
 * for client and server components
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') })

interface EnvironmentTest {
  name: string
  required: boolean
  type: 'client' | 'server' | 'both'
  value: string | undefined
}

const environmentVariables: EnvironmentTest[] = [
  // Stripe (Client)
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
  },

  // Stripe (Server)
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    type: 'server',
    value: process.env.STRIPE_SECRET_KEY
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    type: 'server',
    value: process.env.STRIPE_WEBHOOK_SECRET
  },
  {
    name: 'STRIPE_MONTHLY_PRICE_ID',
    required: false,
    type: 'server',
    value: process.env.STRIPE_MONTHLY_PRICE_ID
  },

  // Clerk (Client)
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  },
  {
    name: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL
  },
  {
    name: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL
  },

  // Clerk (Server)
  {
    name: 'CLERK_SECRET_KEY',
    required: true,
    type: 'server',
    value: process.env.CLERK_SECRET_KEY
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    required: true,
    type: 'server',
    value: process.env.CLERK_WEBHOOK_SECRET
  },

  // Supabase (Client)
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    type: 'both',
    value: process.env.NEXT_PUBLIC_SUPABASE_URL
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    type: 'both',
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },

  // Supabase (Server)
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    type: 'server',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // App Configuration
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    type: 'client',
    value: process.env.NEXT_PUBLIC_APP_URL
  },

  // OpenAI
  {
    name: 'OPENAI_API_KEY',
    required: true,
    type: 'server',
    value: process.env.OPENAI_API_KEY
  }
]

function testEnvironmentVariables() {
  console.log('\n' + '='.repeat(70))
  console.log('ENVIRONMENT VARIABLES VALIDATION TEST')
  console.log('='.repeat(70) + '\n')

  let passed = 0
  let failed = 0
  const failures: string[] = []

  console.log('Testing environment variables...\n')

  for (const envVar of environmentVariables) {
    const status = envVar.value ? '✅' : (envVar.required ? '❌' : '⚠️ ')
    const statusText = envVar.value ? 'SET' : (envVar.required ? 'MISSING' : 'OPTIONAL')
    const typeText = envVar.type.toUpperCase().padEnd(6)

    console.log(`${status} [${typeText}] ${envVar.name.padEnd(45)} ${statusText}`)

    if (envVar.required && !envVar.value) {
      failed++
      failures.push(`Missing required ${envVar.type} variable: ${envVar.name}`)
    } else if (envVar.value) {
      passed++
    }
  }

  console.log('\n' + '-'.repeat(70))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log('-'.repeat(70))

  if (failures.length > 0) {
    console.log('\n❌ FAILURES:')
    failures.forEach(f => console.log(`   - ${f}`))
    console.log('\n')
    return false
  }

  console.log('\n✅ All required environment variables are set!\n')
  return true
}

function testPriceIdAccessibility() {
  console.log('='.repeat(70))
  console.log('CLIENT-SIDE PRICE ID ACCESSIBILITY TEST')
  console.log('='.repeat(70) + '\n')

  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

  console.log('CRITICAL TEST: Can client components access NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID?')
  console.log('-'.repeat(70))
  console.log('Value:', priceId)
  console.log('Is defined:', !!priceId)
  console.log('Type:', typeof priceId)
  console.log()

  if (!priceId) {
    console.log('❌ CRITICAL ISSUE IDENTIFIED!')
    console.log('The price ID is NOT accessible in this environment.')
    console.log('\nThis means in client components:')
    console.log('  process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID === undefined')
    console.log()
    console.log('SOLUTION REQUIRED:')
    console.log('  1. Hardcode the price ID in client components')
    console.log('  2. OR fetch it from an API endpoint')
    console.log('  3. OR pass it as a prop from a server component')
    console.log()
    return false
  }

  console.log('✅ Price ID is accessible')
  console.log()
  return true
}

function main() {
  const envTest = testEnvironmentVariables()
  const priceTest = testPriceIdAccessibility()

  console.log('='.repeat(70))
  console.log('FINAL RESULT')
  console.log('='.repeat(70))

  if (envTest && priceTest) {
    console.log('✅ All tests PASSED')
    process.exit(0)
  } else {
    console.log('❌ Some tests FAILED')
    process.exit(1)
  }
}

main()
