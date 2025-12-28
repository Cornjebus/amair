import type { DatabaseAbstractionLayer, DatabaseAdapter } from './types';
import { supabaseAdapter } from './adapters/supabase';

// Lazy load Drizzle adapter only when needed
let drizzleAdapterInstance: DatabaseAbstractionLayer | null = null;

async function getDrizzleAdapter(): Promise<DatabaseAbstractionLayer> {
  if (!drizzleAdapterInstance) {
    const { drizzleAdapter } = await import('./adapters/drizzle');
    drizzleAdapterInstance = drizzleAdapter;
  }
  return drizzleAdapterInstance;
}

// Get current adapter based on environment
function getCurrentAdapter(): DatabaseAdapter {
  return process.env.USE_NEON === 'true' ? 'drizzle' : 'supabase';
}

/**
 * Get the database abstraction layer based on the current configuration.
 *
 * Uses USE_NEON environment variable to determine which adapter to use:
 * - USE_NEON=true: Uses Drizzle/Neon adapter
 * - USE_NEON=false (default): Uses Supabase adapter
 *
 * @returns DatabaseAbstractionLayer instance
 */
export async function getDatabase(): Promise<DatabaseAbstractionLayer> {
  const adapter = getCurrentAdapter();

  if (adapter === 'drizzle') {
    return getDrizzleAdapter();
  }

  return supabaseAdapter;
}

/**
 * Synchronous version that returns Supabase adapter.
 * Use this when you can't use async/await (e.g., in component initialization).
 * Note: This always returns Supabase adapter for synchronous access.
 *
 * @deprecated Use getDatabase() for full adapter support
 */
export function getDatabaseSync(): DatabaseAbstractionLayer {
  // For sync access, we can only reliably return Supabase
  // since Drizzle adapter uses dynamic import
  if (process.env.USE_NEON === 'true') {
    console.warn('getDatabaseSync called with USE_NEON=true, but returning Supabase adapter for sync access');
  }
  return supabaseAdapter;
}

// Re-export types
export * from './types';
export * from './schema';
