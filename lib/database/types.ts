import type { User, NewUser, Child, NewChild } from './schema/users';
import type { Story, NewStory } from './schema/stories';
import type { CreditAccount, CreditTransaction, NewCreditTransaction, CreditPackage } from './schema/credits';
import type { UserSubscription, TierLimit, UsageTrackingEntry, NewUsageTrackingEntry } from './schema/subscriptions';
import type { SubscriptionTier } from './schema/enums';
import type { GiftPackage, GiftSubscription } from './schema/gifts';
import type { FamilyUniverse, NewFamilyUniverse, Character, NewCharacter } from './schema/universe';

// RPC-equivalent function result types

export interface AddCreditsResult {
  success: boolean;
  newBalance: number;
  transactionId: string | null;
  errorMessage: string | null;
}

export interface RedeemGiftCodeResult {
  success: boolean;
  errorMessage: string | null;
  tier: SubscriptionTier | null;
  durationMonths: number;
  newPeriodEnd: string | null;
}

export interface RecordStoryGenerationResult {
  success: boolean;
  storiesRemaining: number;
  premiumVoicesRemaining: number;
}

// Repository interfaces for database abstraction layer

export interface UserRepository {
  findByClerkId(clerkId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  delete(clerkId: string): Promise<boolean>;
}

export interface ChildRepository {
  findByUserId(userId: string): Promise<Child[]>;
  findById(id: string): Promise<Child | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Child | null>;
  create(data: NewChild): Promise<Child>;
  update(id: string, userId: string, data: Partial<Child>): Promise<Child | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface StoryRepository {
  findByUserId(userId: string, options?: { limit?: number; orderBy?: 'created_at' }): Promise<Story[]>;
  findById(id: string): Promise<Story | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Story | null>;
  create(data: NewStory): Promise<Story>;
  update(id: string, data: Partial<Story>): Promise<Story | null>;
  delete(id: string): Promise<boolean>;
}

export interface CreditRepository {
  getAccount(userId: string): Promise<CreditAccount | null>;
  getBalance(userId: string): Promise<number>;
  createAccount(userId: string): Promise<CreditAccount>;
  updateBalance(userId: string, newBalance: number): Promise<CreditAccount | null>;
  getTransactions(userId: string, options?: { limit?: number; offset?: number }): Promise<CreditTransaction[]>;
  createTransaction(data: NewCreditTransaction): Promise<CreditTransaction>;
  getPackages(options?: { activeOnly?: boolean }): Promise<CreditPackage[]>;
}

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<UserSubscription | null>;
  create(data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription>;
  update(userId: string, data: Partial<UserSubscription>): Promise<UserSubscription | null>;
  upsert(data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription>;
  getTierLimits(tier: string): Promise<TierLimit | null>;
  getAllTierLimits(): Promise<TierLimit[]>;
}

export interface UsageRepository {
  findByUserAndPeriod(userId: string, periodStart: string): Promise<UsageTrackingEntry | null>;
  create(data: NewUsageTrackingEntry): Promise<UsageTrackingEntry>;
  update(id: string, data: Partial<UsageTrackingEntry>): Promise<UsageTrackingEntry | null>;
  upsert(data: NewUsageTrackingEntry): Promise<UsageTrackingEntry>;
  incrementStories(userId: string, periodStart: string): Promise<void>;
  incrementPremiumVoices(userId: string, periodStart: string): Promise<void>;
}

export interface GiftRepository {
  getPackages(options?: { activeOnly?: boolean }): Promise<GiftPackage[]>;
  findSubscriptionByCode(code: string): Promise<(GiftSubscription & { giftPackage?: GiftPackage }) | null>;
  createSubscription(data: Omit<GiftSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<GiftSubscription>;
  updateSubscription(id: string, data: Partial<GiftSubscription>): Promise<GiftSubscription | null>;
}

export interface UniverseRepository {
  getOrCreateUniverse(userId: string): Promise<string>; // Returns universe ID
  findByUserId(userId: string): Promise<FamilyUniverse | null>;
  update(userId: string, data: Partial<FamilyUniverse>): Promise<FamilyUniverse | null>;
  getCharacters(userId: string, options?: { activeOnly?: boolean }): Promise<Character[]>;
  createCharacter(data: NewCharacter): Promise<Character>;
  updateCharacter(id: string, data: Partial<Character>): Promise<Character | null>;
}

// Main Database Abstraction Layer interface
export interface DatabaseAbstractionLayer {
  users: UserRepository;
  children: ChildRepository;
  stories: StoryRepository;
  credits: CreditRepository;
  subscriptions: SubscriptionRepository;
  usage: UsageRepository;
  gifts: GiftRepository;
  universe: UniverseRepository;

  // RPC-equivalent functions (atomic transactions)
  addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'usage' | 'bonus' | 'refund' | 'gift' | 'subscription' | 'adjustment',
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<AddCreditsResult>;

  redeemGiftCode(userId: string, redemptionCode: string): Promise<RedeemGiftCodeResult>;

  recordStoryGeneration(userId: string, usedPremiumVoice?: boolean): Promise<RecordStoryGenerationResult>;

  // Transaction support
  transaction<T>(fn: (tx: DatabaseAbstractionLayer) => Promise<T>): Promise<T>;
}

// Type for adapter selection
export type DatabaseAdapter = 'supabase' | 'drizzle';
