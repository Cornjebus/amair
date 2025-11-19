#!/usr/bin/env tsx
/**
 * Verification script for database migration
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyMigration() {
  console.log('🔍 Verifying database migration...\n')

  try {
    // Test 1: Check tier_limits table
    console.log('1️⃣ Checking tier_limits table...')
    const { data: tiers, error: tiersError } = await supabase
      .from('tier_limits')
      .select('*')
      .order('tier_name')

    if (tiersError) {
      console.error('❌ Error:', tiersError.message)
      return false
    }

    console.log(`✅ Found ${tiers?.length} tiers:`)
    tiers?.forEach(tier => {
      console.log(`   - ${tier.tier_name}: ${tier.monthly_stories} stories/month`)
    })
    console.log()

    // Test 2: Check users table has new columns
    console.log('2️⃣ Checking users table structure...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, subscription_tier, stripe_subscription_id')
      .limit(1)

    if (usersError) {
      console.error('❌ Error:', usersError.message)
      return false
    }

    console.log('✅ Users table has new columns (subscription_tier, stripe_subscription_id)')
    console.log()

    // Test 3: Check usage_tracking table
    console.log('3️⃣ Checking usage_tracking table...')
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .limit(1)

    if (usageError && !usageError.message.includes('no rows')) {
      console.error('❌ Error:', usageError.message)
      return false
    }

    console.log('✅ usage_tracking table exists and is accessible')
    console.log()

    console.log('🎉 Migration verification complete! All tables created successfully.')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

verifyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
