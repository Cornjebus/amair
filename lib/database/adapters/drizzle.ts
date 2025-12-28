import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../client';
import * as schema from '../schema';
import type {
  DatabaseAbstractionLayer,
  UserRepository,
  ChildRepository,
  StoryRepository,
  CreditRepository,
  SubscriptionRepository,
  UsageRepository,
  GiftRepository,
} from '../types';
import type { User, NewUser, Child, NewChild } from '../schema/users';
import type { Story, NewStory } from '../schema/stories';
import type { CreditAccount, CreditTransaction, NewCreditTransaction, CreditPackage } from '../schema/credits';
import type { UserSubscription, TierLimit, UsageTrackingEntry, NewUsageTrackingEntry } from '../schema/subscriptions';
import type { GiftPackage, GiftSubscription } from '../schema/gifts';

// Drizzle User Repository
const userRepository: UserRepository = {
  async findByClerkId(clerkId: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.clerkId, clerkId),
    });
    return result ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return result ?? null;
  },

  async create(userData: NewUser): Promise<User> {
    const [result] = await db.insert(schema.users).values(userData).returning();
    return result;
  },

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const [result] = await db
      .update(schema.users)
      .set({ ...userData, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, id))
      .returning();
    return result ?? null;
  },

  async delete(clerkId: string): Promise<boolean> {
    const result = await db
      .delete(schema.users)
      .where(eq(schema.users.clerkId, clerkId))
      .returning({ id: schema.users.id });
    return result.length > 0;
  },
};

// Drizzle Child Repository
const childRepository: ChildRepository = {
  async findByUserId(userId: string): Promise<Child[]> {
    return db.query.children.findMany({
      where: eq(schema.children.userId, userId),
      orderBy: desc(schema.children.createdAt),
    });
  },

  async findById(id: string): Promise<Child | null> {
    const result = await db.query.children.findFirst({
      where: eq(schema.children.id, id),
    });
    return result ?? null;
  },

  async findByIdAndUserId(id: string, userId: string): Promise<Child | null> {
    const result = await db.query.children.findFirst({
      where: and(eq(schema.children.id, id), eq(schema.children.userId, userId)),
    });
    return result ?? null;
  },

  async create(childData: NewChild): Promise<Child> {
    const [result] = await db.insert(schema.children).values(childData).returning();
    return result;
  },

  async update(id: string, userId: string, childData: Partial<Child>): Promise<Child | null> {
    const [result] = await db
      .update(schema.children)
      .set({ ...childData, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.children.id, id), eq(schema.children.userId, userId)))
      .returning();
    return result ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(schema.children)
      .where(and(eq(schema.children.id, id), eq(schema.children.userId, userId)))
      .returning({ id: schema.children.id });
    return result.length > 0;
  },
};

// Drizzle Story Repository
const storyRepository: StoryRepository = {
  async findByUserId(userId: string, options?: { limit?: number }): Promise<Story[]> {
    return db.query.stories.findMany({
      where: eq(schema.stories.userId, userId),
      orderBy: desc(schema.stories.createdAt),
      limit: options?.limit,
    });
  },

  async findById(id: string): Promise<Story | null> {
    const result = await db.query.stories.findFirst({
      where: eq(schema.stories.id, id),
    });
    return result ?? null;
  },

  async findByIdAndUserId(id: string, userId: string): Promise<Story | null> {
    const result = await db.query.stories.findFirst({
      where: and(eq(schema.stories.id, id), eq(schema.stories.userId, userId)),
    });
    return result ?? null;
  },

  async create(storyData: NewStory): Promise<Story> {
    const [result] = await db.insert(schema.stories).values(storyData).returning();
    return result;
  },

  async update(id: string, storyData: Partial<Story>): Promise<Story | null> {
    const [result] = await db
      .update(schema.stories)
      .set({ ...storyData, updatedAt: new Date().toISOString() })
      .where(eq(schema.stories.id, id))
      .returning();
    return result ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(schema.stories)
      .where(eq(schema.stories.id, id))
      .returning({ id: schema.stories.id });
    return result.length > 0;
  },
};

// Drizzle Credit Repository
const creditRepository: CreditRepository = {
  async getAccount(userId: string): Promise<CreditAccount | null> {
    const result = await db.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.userId, userId),
    });
    return result ?? null;
  },

  async getBalance(userId: string): Promise<number> {
    const account = await this.getAccount(userId);
    return account?.balance ?? 0;
  },

  async createAccount(userId: string): Promise<CreditAccount> {
    const [result] = await db
      .insert(schema.creditAccounts)
      .values({ userId, balance: 0, lifetimeCredits: 0 })
      .returning();
    return result;
  },

  async updateBalance(userId: string, newBalance: number): Promise<CreditAccount | null> {
    const [result] = await db
      .update(schema.creditAccounts)
      .set({ balance: newBalance, updatedAt: new Date().toISOString() })
      .where(eq(schema.creditAccounts.userId, userId))
      .returning();
    return result ?? null;
  },

  async getTransactions(userId: string, options?: { limit?: number; offset?: number }): Promise<CreditTransaction[]> {
    return db.query.creditTransactions.findMany({
      where: eq(schema.creditTransactions.userId, userId),
      orderBy: desc(schema.creditTransactions.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  },

  async createTransaction(txData: NewCreditTransaction): Promise<CreditTransaction> {
    const [result] = await db.insert(schema.creditTransactions).values(txData).returning();
    return result;
  },

  async getPackages(options?: { activeOnly?: boolean }): Promise<CreditPackage[]> {
    if (options?.activeOnly) {
      return db.query.creditPackages.findMany({
        where: eq(schema.creditPackages.isActive, true),
        orderBy: schema.creditPackages.sortOrder,
      });
    }
    return db.query.creditPackages.findMany({
      orderBy: schema.creditPackages.sortOrder,
    });
  },
};

// Drizzle Subscription Repository
const subscriptionRepository: SubscriptionRepository = {
  async findByUserId(userId: string): Promise<UserSubscription | null> {
    const result = await db.query.userSubscriptions.findFirst({
      where: eq(schema.userSubscriptions.userId, userId),
    });
    return result ?? null;
  },

  async create(subData: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
    const [result] = await db.insert(schema.userSubscriptions).values(subData).returning();
    return result;
  },

  async update(userId: string, subData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    const [result] = await db
      .update(schema.userSubscriptions)
      .set({ ...subData, updatedAt: new Date().toISOString() })
      .where(eq(schema.userSubscriptions.userId, userId))
      .returning();
    return result ?? null;
  },

  async upsert(subData: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
    const [result] = await db
      .insert(schema.userSubscriptions)
      .values(subData)
      .onConflictDoUpdate({
        target: schema.userSubscriptions.userId,
        set: { ...subData, updatedAt: new Date().toISOString() },
      })
      .returning();
    return result;
  },

  async getTierLimits(tier: string): Promise<TierLimit | null> {
    const result = await db.query.tierLimits.findFirst({
      where: eq(schema.tierLimits.tierName, tier as any),
    });
    return result ?? null;
  },

  async getAllTierLimits(): Promise<TierLimit[]> {
    return db.query.tierLimits.findMany();
  },
};

// Drizzle Usage Repository
const usageRepository: UsageRepository = {
  async findByUserAndPeriod(userId: string, periodStart: string): Promise<UsageTrackingEntry | null> {
    const result = await db.query.usageTracking.findFirst({
      where: and(
        eq(schema.usageTracking.userId, userId),
        eq(schema.usageTracking.billingPeriodStart, periodStart)
      ),
    });
    return result ?? null;
  },

  async create(usageData: NewUsageTrackingEntry): Promise<UsageTrackingEntry> {
    const [result] = await db.insert(schema.usageTracking).values(usageData).returning();
    return result;
  },

  async update(id: string, usageData: Partial<UsageTrackingEntry>): Promise<UsageTrackingEntry | null> {
    const [result] = await db
      .update(schema.usageTracking)
      .set({ ...usageData, updatedAt: new Date().toISOString() })
      .where(eq(schema.usageTracking.id, id))
      .returning();
    return result ?? null;
  },

  async upsert(usageData: NewUsageTrackingEntry): Promise<UsageTrackingEntry> {
    // Drizzle doesn't have built-in upsert with composite key, so we check first
    const existing = await this.findByUserAndPeriod(usageData.userId, usageData.billingPeriodStart);
    if (existing) {
      const result = await this.update(existing.id, usageData);
      return result!;
    }
    return this.create(usageData);
  },

  async incrementStories(userId: string, periodStart: string): Promise<void> {
    await db
      .update(schema.usageTracking)
      .set({
        storiesGenerated: sql`${schema.usageTracking.storiesGenerated} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(schema.usageTracking.userId, userId),
          eq(schema.usageTracking.billingPeriodStart, periodStart)
        )
      );
  },

  async incrementPremiumVoices(userId: string, periodStart: string): Promise<void> {
    await db
      .update(schema.usageTracking)
      .set({
        premiumVoicesUsed: sql`${schema.usageTracking.premiumVoicesUsed} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(schema.usageTracking.userId, userId),
          eq(schema.usageTracking.billingPeriodStart, periodStart)
        )
      );
  },
};

// Drizzle Gift Repository
const giftRepository: GiftRepository = {
  async getPackages(options?: { activeOnly?: boolean }): Promise<GiftPackage[]> {
    if (options?.activeOnly) {
      return db.query.giftPackages.findMany({
        where: eq(schema.giftPackages.isActive, true),
        orderBy: schema.giftPackages.displayOrder,
      });
    }
    return db.query.giftPackages.findMany({
      orderBy: schema.giftPackages.displayOrder,
    });
  },

  async findSubscriptionByCode(code: string): Promise<(GiftSubscription & { giftPackage?: GiftPackage }) | null> {
    const normalizedCode = code.toUpperCase().trim();
    const result = await db.query.giftSubscriptions.findFirst({
      where: eq(schema.giftSubscriptions.redemptionCode, normalizedCode),
      with: {
        giftPackage: true,
      },
    });
    return result ?? null;
  },

  async createSubscription(subData: Omit<GiftSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<GiftSubscription> {
    const [result] = await db.insert(schema.giftSubscriptions).values(subData).returning();
    return result;
  },

  async updateSubscription(id: string, subData: Partial<GiftSubscription>): Promise<GiftSubscription | null> {
    const [result] = await db
      .update(schema.giftSubscriptions)
      .set({ ...subData, updatedAt: new Date().toISOString() })
      .where(eq(schema.giftSubscriptions.id, id))
      .returning();
    return result ?? null;
  },
};

// Drizzle Database Abstraction Layer
export const drizzleAdapter: DatabaseAbstractionLayer = {
  users: userRepository,
  children: childRepository,
  stories: storyRepository,
  credits: creditRepository,
  subscriptions: subscriptionRepository,
  usage: usageRepository,
  gifts: giftRepository,

  // Drizzle supports true database transactions
  async transaction<T>(fn: (tx: DatabaseAbstractionLayer) => Promise<T>): Promise<T> {
    // Note: For true transaction support, we'd need to pass the transaction
    // context to each repository. This is a simplified version.
    // TODO: Implement proper transaction context passing
    return fn(this);
  },
};
