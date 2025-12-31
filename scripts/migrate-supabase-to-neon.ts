/**
 * Supabase to Neon Data Migration Script
 *
 * Run with: npx tsx scripts/migrate-supabase-to-neon.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';

// Table migration order (respects foreign key dependencies)
const MIGRATION_ORDER = [
  'users',
  'children',
  'stories',
  'story_seeds',
  'daily_challenges',
  'credit_accounts',
  'credit_costs',
  'credit_packages',
  'credit_purchases',
  'credit_transactions',
  'tier_limits',
  'subscription_prices',
  'user_subscriptions',
  'subscription_history',
  'usage_tracking',
  'gift_packages',
  'gift_subscriptions',
];

function escapeValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    return `ARRAY[${val.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',')}]::text[]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  // String
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function migrate() {
  console.log('🚀 Starting Supabase to Neon migration...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Initialize Neon client using Pool (supports dynamic queries)
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  const stats: Record<string, { migrated: number; errors: number }> = {};

  for (const tableName of MIGRATION_ORDER) {
    console.log(`📦 Migrating table: ${tableName}`);
    stats[tableName] = { migrated: 0, errors: 0 };

    try {
      // Fetch all data from Supabase
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`  ❌ Error fetching from Supabase: ${error.message}`);
        stats[tableName].errors++;
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`  ⏭️  No data to migrate (0 rows)`);
        continue;
      }

      console.log(`  📥 Found ${data.length} rows to migrate`);

      // Insert each row
      for (const row of data) {
        try {
          const columns = Object.keys(row);
          const columnList = columns.map(c => `"${c}"`).join(', ');
          const valueList = columns.map(c => escapeValue(row[c])).join(', ');

          // Use Pool.query() for dynamic queries
          const query = `INSERT INTO "${tableName}" (${columnList}) VALUES (${valueList}) ON CONFLICT DO NOTHING`;
          await pool.query(query);
          stats[tableName].migrated++;
        } catch (insertError: any) {
          console.error(`  ❌ Error inserting row: ${insertError.message}`);
          stats[tableName].errors++;
        }
      }

      console.log(`  ✅ Migrated ${stats[tableName].migrated} rows`);
    } catch (tableError: any) {
      console.error(`  ❌ Error migrating table: ${tableError.message}`);
      stats[tableName].errors++;
    }
  }

  // Close the pool
  await pool.end();

  // Print summary
  console.log('\n📊 Migration Summary:');
  console.log('─'.repeat(50));

  let totalMigrated = 0;
  let totalErrors = 0;

  for (const [table, { migrated, errors }] of Object.entries(stats)) {
    const status = errors > 0 ? '⚠️' : '✅';
    console.log(`${status} ${table}: ${migrated} rows migrated, ${errors} errors`);
    totalMigrated += migrated;
    totalErrors += errors;
  }

  console.log('─'.repeat(50));
  console.log(`Total: ${totalMigrated} rows migrated, ${totalErrors} errors`);

  if (totalErrors === 0) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n⚠️ Migration completed with some errors. Please review.');
  }
}

migrate().catch(console.error);
