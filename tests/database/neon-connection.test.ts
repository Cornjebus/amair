import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Note: These tests require DATABASE_URL to be set
// Skip in CI if Neon is not configured yet
const skipIfNoDatabase = !process.env.DATABASE_URL ? describe.skip : describe;

skipIfNoDatabase('Neon Database Connection', () => {
  it('should have DATABASE_URL environment variable', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain('neon.tech');
  });

  it('should connect to Neon database', async () => {
    const { db } = await import('@/lib/database/client');
    const { sql } = await import('drizzle-orm');

    const result = await db.execute(sql`SELECT 1 as test`);
    expect(result.rows[0]).toHaveProperty('test', 1);
  });

  it('should query tables', async () => {
    const { db } = await import('@/lib/database/client');
    const { sql } = await import('drizzle-orm');

    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = result.rows.map((r: any) => r.table_name);

    // Verify key tables exist
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('stories');
    expect(tableNames).toContain('credit_accounts');
    expect(tableNames).toContain('user_subscriptions');
  });
});

describe('Drizzle Schema', () => {
  it('should export all enums', async () => {
    const schema = await import('@/lib/database/schema');

    expect(schema.creditTransactionTypeEnum).toBeDefined();
    expect(schema.storyLengthEnum).toBeDefined();
    expect(schema.storyToneEnum).toBeDefined();
    expect(schema.subscriptionStatusEnum).toBeDefined();
    expect(schema.subscriptionTierEnum).toBeDefined();
  });

  it('should export all tables', async () => {
    const schema = await import('@/lib/database/schema');

    // Users
    expect(schema.users).toBeDefined();
    expect(schema.children).toBeDefined();

    // Stories
    expect(schema.stories).toBeDefined();
    expect(schema.storySeeds).toBeDefined();
    expect(schema.dailyChallenges).toBeDefined();

    // Credits
    expect(schema.creditAccounts).toBeDefined();
    expect(schema.creditTransactions).toBeDefined();
    expect(schema.creditCosts).toBeDefined();
    expect(schema.creditPackages).toBeDefined();
    expect(schema.creditPurchases).toBeDefined();

    // Subscriptions
    expect(schema.userSubscriptions).toBeDefined();
    expect(schema.subscriptionPrices).toBeDefined();
    expect(schema.tierLimits).toBeDefined();
    expect(schema.subscriptionHistory).toBeDefined();
    expect(schema.usageTracking).toBeDefined();

    // Gifts
    expect(schema.giftPackages).toBeDefined();
    expect(schema.giftSubscriptions).toBeDefined();
  });

  it('should have correct column definitions for users table', async () => {
    const { users } = await import('@/lib/database/schema');

    // Check users table columns
    expect(users.id).toBeDefined();
    expect(users.clerkId).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.stripeCustomerId).toBeDefined();
    expect(users.subscriptionTier).toBeDefined();
  });

  it('should have correct column definitions for stories table', async () => {
    const { stories } = await import('@/lib/database/schema');

    expect(stories.id).toBeDefined();
    expect(stories.userId).toBeDefined();
    expect(stories.title).toBeDefined();
    expect(stories.content).toBeDefined();
    expect(stories.length).toBeDefined();
    expect(stories.tone).toBeDefined();
    expect(stories.wordCount).toBeDefined();
  });

  it('should have correct column definitions for credit_accounts table', async () => {
    const { creditAccounts } = await import('@/lib/database/schema');

    expect(creditAccounts.id).toBeDefined();
    expect(creditAccounts.userId).toBeDefined();
    expect(creditAccounts.balance).toBeDefined();
    expect(creditAccounts.lifetimeCredits).toBeDefined();
  });

  it('should export type definitions', async () => {
    const schema = await import('@/lib/database/schema');

    // These are type-only exports, we just verify the module loads
    expect(schema).toBeDefined();
  });
});

describe('Schema Parity with Supabase', () => {
  it('should have all 17 tables defined', async () => {
    const { schema } = await import('@/lib/database/schema');

    const expectedTables = [
      'users',
      'children',
      'stories',
      'storySeeds',
      'dailyChallenges',
      'creditAccounts',
      'creditTransactions',
      'creditCosts',
      'creditPackages',
      'creditPurchases',
      'userSubscriptions',
      'subscriptionPrices',
      'tierLimits',
      'subscriptionHistory',
      'usageTracking',
      'giftPackages',
      'giftSubscriptions',
    ];

    expectedTables.forEach(table => {
      expect(schema[table as keyof typeof schema]).toBeDefined();
    });

    expect(Object.keys(schema).length).toBe(17);
  });
});
