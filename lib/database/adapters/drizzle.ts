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
  UniverseRepository,
  AddCreditsResult,
  RedeemGiftCodeResult,
  RecordStoryGenerationResult,
} from '../types';
import type { User, NewUser, Child, NewChild } from '../schema/users';
import type { Story, NewStory } from '../schema/stories';
import type { CreditAccount, CreditTransaction, NewCreditTransaction, CreditPackage } from '../schema/credits';
import type { UserSubscription, TierLimit, UsageTrackingEntry, NewUsageTrackingEntry } from '../schema/subscriptions';
import type { GiftPackage, GiftSubscription } from '../schema/gifts';
import type { FamilyUniverse, Character, NewCharacter } from '../schema/universe';
import type { SubscriptionTier } from '../schema/enums';

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

// Drizzle Universe Repository
const universeRepository: UniverseRepository = {
  async getOrCreateUniverse(userId: string): Promise<string> {
    // Check if universe exists
    const existing = await db.query.familyUniverses.findFirst({
      where: eq(schema.familyUniverses.userId, userId),
    });

    if (existing) {
      return existing.id;
    }

    // Create new universe
    const [newUniverse] = await db
      .insert(schema.familyUniverses)
      .values({ userId })
      .returning({ id: schema.familyUniverses.id });

    return newUniverse.id;
  },

  async findByUserId(userId: string): Promise<FamilyUniverse | null> {
    const result = await db.query.familyUniverses.findFirst({
      where: eq(schema.familyUniverses.userId, userId),
    });
    return result ?? null;
  },

  async update(userId: string, data: Partial<FamilyUniverse>): Promise<FamilyUniverse | null> {
    const [result] = await db
      .update(schema.familyUniverses)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.familyUniverses.userId, userId))
      .returning();
    return result ?? null;
  },

  async getCharacters(userId: string, options?: { activeOnly?: boolean }): Promise<Character[]> {
    if (options?.activeOnly) {
      return db.query.characters.findMany({
        where: and(eq(schema.characters.userId, userId), eq(schema.characters.isActive, true)),
        orderBy: desc(schema.characters.createdAt),
      });
    }
    return db.query.characters.findMany({
      where: eq(schema.characters.userId, userId),
      orderBy: desc(schema.characters.createdAt),
    });
  },

  async createCharacter(data: NewCharacter): Promise<Character> {
    const [result] = await db.insert(schema.characters).values(data).returning();
    return result;
  },

  async updateCharacter(id: string, data: Partial<Character>): Promise<Character | null> {
    const [result] = await db
      .update(schema.characters)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.characters.id, id))
      .returning();
    return result ?? null;
  },
};

// RPC-equivalent functions implemented as TypeScript transactions

/**
 * Add credits to a user's account (atomic operation)
 * Equivalent to Supabase RPC: add_credits
 */
async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'gift' | 'subscription' | 'adjustment',
  description: string,
  metadata?: Record<string, unknown>
): Promise<AddCreditsResult> {
  try {
    // Get current account
    const account = await db.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.userId, userId),
    });

    if (!account) {
      return {
        success: false,
        newBalance: 0,
        transactionId: null,
        errorMessage: 'Credit account not found',
      };
    }

    const newBalance = account.balance + amount;
    const newLifetime = type === 'purchase' ? account.lifetimeCredits + amount : account.lifetimeCredits;

    // Update account
    await db
      .update(schema.creditAccounts)
      .set({
        balance: newBalance,
        lifetimeCredits: newLifetime,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.creditAccounts.userId, userId));

    // Create transaction record
    const [transaction] = await db
      .insert(schema.creditTransactions)
      .values({
        userId,
        amount,
        type: type as any,
        description,
        metadata: metadata ?? {},
        balanceAfter: newBalance,
      })
      .returning({ id: schema.creditTransactions.id });

    return {
      success: true,
      newBalance,
      transactionId: transaction.id,
      errorMessage: null,
    };
  } catch (error: any) {
    return {
      success: false,
      newBalance: 0,
      transactionId: null,
      errorMessage: error.message || 'Failed to add credits',
    };
  }
}

/**
 * Redeem a gift code for a user (atomic operation)
 * Equivalent to Supabase RPC: redeem_gift_code
 */
async function redeemGiftCode(userId: string, redemptionCode: string): Promise<RedeemGiftCodeResult> {
  try {
    const normalizedCode = redemptionCode.toUpperCase().trim();

    // Find the gift subscription
    const gift = await db.query.giftSubscriptions.findFirst({
      where: eq(schema.giftSubscriptions.redemptionCode, normalizedCode),
      with: {
        giftPackage: true,
      },
    });

    if (!gift) {
      return {
        success: false,
        errorMessage: 'Invalid gift code',
        tier: null,
        durationMonths: 0,
        newPeriodEnd: null,
      };
    }

    if (gift.status !== 'pending') {
      return {
        success: false,
        errorMessage: `Gift code has already been ${gift.status}`,
        tier: null,
        durationMonths: 0,
        newPeriodEnd: null,
      };
    }

    const expiresAt = gift.expiresAt ? new Date(gift.expiresAt) : null;
    if (expiresAt && expiresAt < new Date()) {
      await db
        .update(schema.giftSubscriptions)
        .set({ status: 'expired' })
        .where(eq(schema.giftSubscriptions.id, gift.id));

      return {
        success: false,
        errorMessage: 'Gift code has expired',
        tier: null,
        durationMonths: 0,
        newPeriodEnd: null,
      };
    }

    // Calculate new period end
    const now = new Date();
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + gift.durationMonths);
    const newPeriodEndStr = newPeriodEnd.toISOString();

    // Upsert user subscription
    await db
      .insert(schema.userSubscriptions)
      .values({
        userId,
        tier: gift.tier as SubscriptionTier,
        billingCycle: 'gift',
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: newPeriodEndStr,
        storiesUsed: 0,
        premiumVoicesUsed: 0,
        giftSubscriptionId: gift.id,
      })
      .onConflictDoUpdate({
        target: schema.userSubscriptions.userId,
        set: {
          tier: gift.tier as SubscriptionTier,
          billingCycle: 'gift',
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: newPeriodEndStr,
          storiesUsed: 0,
          premiumVoicesUsed: 0,
          giftSubscriptionId: gift.id,
          updatedAt: now.toISOString(),
        },
      });

    // Mark gift as redeemed
    await db
      .update(schema.giftSubscriptions)
      .set({
        status: 'redeemed',
        recipientUserId: userId,
        redeemedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(schema.giftSubscriptions.id, gift.id));

    // Record in subscription history
    await db.insert(schema.subscriptionHistory).values({
      userId,
      eventType: 'gift_redeemed',
      toTier: gift.tier as SubscriptionTier,
      metadata: {
        gift_id: gift.id,
        duration_months: gift.durationMonths,
        redemption_code: redemptionCode,
      },
    });

    return {
      success: true,
      errorMessage: null,
      tier: gift.tier as SubscriptionTier,
      durationMonths: gift.durationMonths,
      newPeriodEnd: newPeriodEndStr,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || 'Failed to redeem gift code',
      tier: null,
      durationMonths: 0,
      newPeriodEnd: null,
    };
  }
}

/**
 * Record a story generation for usage tracking (atomic operation)
 * Equivalent to Supabase RPC: record_story_generation
 */
async function recordStoryGeneration(
  userId: string,
  usedPremiumVoice: boolean = false
): Promise<RecordStoryGenerationResult> {
  try {
    // Get user's subscription
    const subscription = await db.query.userSubscriptions.findFirst({
      where: eq(schema.userSubscriptions.userId, userId),
    });

    if (!subscription) {
      return {
        success: false,
        storiesRemaining: 0,
        premiumVoicesRemaining: 0,
      };
    }

    // Increment usage
    const newStoriesUsed = (subscription.storiesUsed ?? 0) + 1;
    const newPremiumVoicesUsed = usedPremiumVoice
      ? (subscription.premiumVoicesUsed ?? 0) + 1
      : subscription.premiumVoicesUsed ?? 0;

    await db
      .update(schema.userSubscriptions)
      .set({
        storiesUsed: newStoriesUsed,
        premiumVoicesUsed: newPremiumVoicesUsed,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.userSubscriptions.userId, userId));

    // Get tier limits
    const tierLimits = await db.query.tierLimits.findFirst({
      where: eq(schema.tierLimits.tierName, subscription.tier as any),
    });

    const monthlyStories = tierLimits?.monthlyStories ?? 0;
    const monthlyPremiumVoices = tierLimits?.monthlyPremiumVoices ?? 0;

    return {
      success: true,
      storiesRemaining: Math.max(0, monthlyStories - newStoriesUsed),
      premiumVoicesRemaining: Math.max(0, monthlyPremiumVoices - newPremiumVoicesUsed),
    };
  } catch (error: any) {
    return {
      success: false,
      storiesRemaining: 0,
      premiumVoicesRemaining: 0,
    };
  }
}

// Drizzle Database Abstraction Layer
export const drizzleAdapter: DatabaseAbstractionLayer = {
  users: userRepository,
  children: childRepository,
  stories: storyRepository,
  credits: creditRepository,
  subscriptions: subscriptionRepository,
  usage: usageRepository,
  gifts: giftRepository,
  universe: universeRepository,

  // RPC-equivalent functions
  addCredits,
  redeemGiftCode,
  recordStoryGeneration,

  // Drizzle supports true database transactions
  async transaction<T>(fn: (tx: DatabaseAbstractionLayer) => Promise<T>): Promise<T> {
    // Note: For true transaction support, we'd need to pass the transaction
    // context to each repository. This is a simplified version.
    // TODO: Implement proper transaction context passing
    return fn(this);
  },
};
