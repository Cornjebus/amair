import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/database/schema/index.ts',
  out: './lib/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Don't push to production automatically - use migrations
  strict: true,
  verbose: true,
} satisfies Config;
