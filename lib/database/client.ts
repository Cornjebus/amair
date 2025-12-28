import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

// Create Neon SQL client
const sql = neon(getDatabaseUrl());

// Create Drizzle client with schema
export const db = drizzle(sql, { schema });

// Export types
export type Database = typeof db;
