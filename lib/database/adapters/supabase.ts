import { supabaseAdmin } from '@/lib/supabase/server';
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

// Supabase User Repository
const userRepository: UserRepository = {
  async findByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    if (error || !data) return null;
    return mapSupabaseUser(data);
  },

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapSupabaseUser(data);
  },

  async create(userData: NewUser): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_id: userData.clerkId,
        email: userData.email,
        stripe_customer_id: userData.stripeCustomerId,
        subscription_tier: userData.subscriptionTier,
        subscription_status: userData.subscriptionStatus,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseUser(data);
  },

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const updateData: Record<string, any> = {};
    if (userData.email) updateData.email = userData.email;
    if (userData.stripeCustomerId) updateData.stripe_customer_id = userData.stripeCustomerId;
    if (userData.stripeSubscriptionId) updateData.stripe_subscription_id = userData.stripeSubscriptionId;
    if (userData.subscriptionTier) updateData.subscription_tier = userData.subscriptionTier;
    if (userData.subscriptionStatus) updateData.subscription_status = userData.subscriptionStatus;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseUser(data);
  },

  async delete(clerkId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', clerkId);
    return !error;
  },
};

// Supabase Child Repository
const childRepository: ChildRepository = {
  async findByUserId(userId: string): Promise<Child[]> {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapSupabaseChild);
  },

  async findById(id: string): Promise<Child | null> {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapSupabaseChild(data);
  },

  async findByIdAndUserId(id: string, userId: string): Promise<Child | null> {
    const { data, error } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return mapSupabaseChild(data);
  },

  async create(childData: NewChild): Promise<Child> {
    const { data, error } = await supabaseAdmin
      .from('children')
      .insert({
        user_id: childData.userId,
        name: childData.name,
        age: childData.age,
        avatar_url: childData.avatarUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseChild(data);
  },

  async update(id: string, userId: string, childData: Partial<Child>): Promise<Child | null> {
    const updateData: Record<string, any> = {};
    if (childData.name) updateData.name = childData.name;
    if (childData.age !== undefined) updateData.age = childData.age;
    if (childData.avatarUrl !== undefined) updateData.avatar_url = childData.avatarUrl;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('children')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseChild(data);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('children')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  },
};

// Supabase Story Repository
const storyRepository: StoryRepository = {
  async findByUserId(userId: string, options?: { limit?: number }): Promise<Story[]> {
    let query = supabaseAdmin
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseStory);
  },

  async findById(id: string): Promise<Story | null> {
    const { data, error } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return mapSupabaseStory(data);
  },

  async findByIdAndUserId(id: string, userId: string): Promise<Story | null> {
    const { data, error } = await supabaseAdmin
      .from('stories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return mapSupabaseStory(data);
  },

  async create(storyData: NewStory): Promise<Story> {
    const { data, error } = await supabaseAdmin
      .from('stories')
      .insert({
        user_id: storyData.userId,
        title: storyData.title,
        content: storyData.content,
        length: storyData.length,
        tone: storyData.tone,
        word_count: storyData.wordCount,
        ai_provider: storyData.aiProvider,
        ai_model: storyData.aiModel,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseStory(data);
  },

  async update(id: string, storyData: Partial<Story>): Promise<Story | null> {
    const updateData: Record<string, any> = {};
    if (storyData.title) updateData.title = storyData.title;
    if (storyData.content) updateData.content = storyData.content;
    if (storyData.audioUrl !== undefined) updateData.audio_url = storyData.audioUrl;
    if (storyData.rating !== undefined) updateData.rating = storyData.rating;
    if (storyData.feedback !== undefined) updateData.feedback = storyData.feedback;
    if (storyData.isFavorite !== undefined) updateData.is_favorite = storyData.isFavorite;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseStory(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('stories')
      .delete()
      .eq('id', id);
    return !error;
  },
};

// Supabase Credit Repository
const creditRepository: CreditRepository = {
  async getAccount(userId: string): Promise<CreditAccount | null> {
    const { data, error } = await supabaseAdmin
      .from('credit_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return mapSupabaseCreditAccount(data);
  },

  async getBalance(userId: string): Promise<number> {
    const account = await this.getAccount(userId);
    return account?.balance ?? 0;
  },

  async createAccount(userId: string): Promise<CreditAccount> {
    const { data, error } = await supabaseAdmin
      .from('credit_accounts')
      .insert({ user_id: userId, balance: 0, lifetime_credits: 0 })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseCreditAccount(data);
  },

  async updateBalance(userId: string, newBalance: number): Promise<CreditAccount | null> {
    const { data, error } = await supabaseAdmin
      .from('credit_accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseCreditAccount(data);
  },

  async getTransactions(userId: string, options?: { limit?: number; offset?: number }): Promise<CreditTransaction[]> {
    let query = supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseCreditTransaction);
  },

  async createTransaction(txData: NewCreditTransaction): Promise<CreditTransaction> {
    const { data, error } = await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: txData.userId,
        amount: txData.amount,
        type: txData.type as any,
        description: txData.description,
        balance_after: txData.balanceAfter,
        related_entity_id: txData.relatedEntityId,
        related_entity_type: txData.relatedEntityType,
        metadata: txData.metadata as any,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseCreditTransaction(data);
  },

  async getPackages(options?: { activeOnly?: boolean }): Promise<CreditPackage[]> {
    let query = supabaseAdmin
      .from('credit_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseCreditPackage);
  },
};

// Supabase Subscription Repository
const subscriptionRepository: SubscriptionRepository = {
  async findByUserId(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return mapSupabaseSubscription(data);
  },

  async create(subData: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: subData.userId,
        tier: subData.tier,
        status: subData.status,
        billing_cycle: subData.billingCycle,
        current_period_start: subData.currentPeriodStart,
        current_period_end: subData.currentPeriodEnd,
        stripe_customer_id: subData.stripeCustomerId,
        stripe_subscription_id: subData.stripeSubscriptionId,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseSubscription(data);
  },

  async update(userId: string, subData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    const updateData: Record<string, any> = {};
    if (subData.tier) updateData.tier = subData.tier;
    if (subData.status) updateData.status = subData.status;
    if (subData.storiesUsed !== undefined) updateData.stories_used = subData.storiesUsed;
    if (subData.premiumVoicesUsed !== undefined) updateData.premium_voices_used = subData.premiumVoicesUsed;
    if (subData.currentPeriodEnd) updateData.current_period_end = subData.currentPeriodEnd;
    if (subData.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = subData.cancelAtPeriodEnd;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseSubscription(data);
  },

  async upsert(subData: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: subData.userId,
        tier: subData.tier,
        status: subData.status,
        billing_cycle: subData.billingCycle,
        current_period_start: subData.currentPeriodStart,
        current_period_end: subData.currentPeriodEnd,
        stripe_customer_id: subData.stripeCustomerId,
        stripe_subscription_id: subData.stripeSubscriptionId,
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseSubscription(data);
  },

  async getTierLimits(tier: string): Promise<TierLimit | null> {
    const { data, error } = await supabaseAdmin
      .from('tier_limits')
      .select('*')
      .eq('tier_name', tier as any)
      .single();
    if (error || !data) return null;
    return mapSupabaseTierLimit(data);
  },

  async getAllTierLimits(): Promise<TierLimit[]> {
    const { data, error } = await supabaseAdmin
      .from('tier_limits')
      .select('*');
    if (error || !data) return [];
    return data.map(mapSupabaseTierLimit);
  },
};

// Supabase Usage Repository
const usageRepository: UsageRepository = {
  async findByUserAndPeriod(userId: string, periodStart: string): Promise<UsageTrackingEntry | null> {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_period_start', periodStart)
      .single();
    if (error || !data) return null;
    return mapSupabaseUsageTracking(data);
  },

  async create(usageData: NewUsageTrackingEntry): Promise<UsageTrackingEntry> {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .insert({
        user_id: usageData.userId,
        billing_period_start: usageData.billingPeriodStart,
        billing_period_end: usageData.billingPeriodEnd,
        stories_generated: usageData.storiesGenerated ?? 0,
        premium_voices_used: usageData.premiumVoicesUsed ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseUsageTracking(data);
  },

  async update(id: string, usageData: Partial<UsageTrackingEntry>): Promise<UsageTrackingEntry | null> {
    const updateData: Record<string, any> = {};
    if (usageData.storiesGenerated !== undefined) updateData.stories_generated = usageData.storiesGenerated;
    if (usageData.premiumVoicesUsed !== undefined) updateData.premium_voices_used = usageData.premiumVoicesUsed;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseUsageTracking(data);
  },

  async upsert(usageData: NewUsageTrackingEntry): Promise<UsageTrackingEntry> {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .upsert({
        user_id: usageData.userId,
        billing_period_start: usageData.billingPeriodStart,
        billing_period_end: usageData.billingPeriodEnd,
        stories_generated: usageData.storiesGenerated ?? 0,
        premium_voices_used: usageData.premiumVoicesUsed ?? 0,
      }, { onConflict: 'user_id,billing_period_start' })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseUsageTracking(data);
  },

  async incrementStories(userId: string, periodStart: string): Promise<void> {
    const current = await this.findByUserAndPeriod(userId, periodStart);
    if (current) {
      await this.update(current.id, { storiesGenerated: (current.storiesGenerated ?? 0) + 1 });
    }
  },

  async incrementPremiumVoices(userId: string, periodStart: string): Promise<void> {
    const current = await this.findByUserAndPeriod(userId, periodStart);
    if (current) {
      await this.update(current.id, { premiumVoicesUsed: (current.premiumVoicesUsed ?? 0) + 1 });
    }
  },
};

// Supabase Gift Repository
const giftRepository: GiftRepository = {
  async getPackages(options?: { activeOnly?: boolean }): Promise<GiftPackage[]> {
    let query = supabaseAdmin
      .from('gift_packages')
      .select('*')
      .order('display_order', { ascending: true });

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseGiftPackage);
  },

  async findSubscriptionByCode(code: string): Promise<(GiftSubscription & { giftPackage?: GiftPackage }) | null> {
    const normalizedCode = code.toUpperCase().trim();
    const { data, error } = await supabaseAdmin
      .from('gift_subscriptions')
      .select('*, gift_package:gift_packages(*)')
      .eq('redemption_code', normalizedCode)
      .single();
    if (error || !data) return null;
    const subscription = mapSupabaseGiftSubscription(data);
    if (data.gift_package) {
      return { ...subscription, giftPackage: mapSupabaseGiftPackage(data.gift_package) };
    }
    return subscription;
  },

  async createSubscription(subData: Omit<GiftSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<GiftSubscription> {
    const { data, error } = await supabaseAdmin
      .from('gift_subscriptions')
      .insert({
        gift_package_id: subData.giftPackageId,
        tier: subData.tier,
        duration_months: subData.durationMonths,
        price_paid_cents: subData.pricePaidCents,
        currency: subData.currency,
        status: subData.status,
        redemption_code: subData.redemptionCode,
        purchaser_user_id: subData.purchaserUserId,
        purchaser_email: subData.purchaserEmail,
        purchaser_name: subData.purchaserName,
        recipient_email: subData.recipientEmail,
        recipient_name: subData.recipientName,
        gift_message: subData.giftMessage,
        delivery_date: subData.deliveryDate,
        expires_at: subData.expiresAt,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSupabaseGiftSubscription(data);
  },

  async updateSubscription(id: string, subData: Partial<GiftSubscription>): Promise<GiftSubscription | null> {
    const updateData: Record<string, any> = {};
    if (subData.status) updateData.status = subData.status;
    if (subData.recipientUserId) updateData.recipient_user_id = subData.recipientUserId;
    if (subData.redeemedAt) updateData.redeemed_at = subData.redeemedAt;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('gift_subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return null;
    return mapSupabaseGiftSubscription(data);
  },
};

// Mapping functions (Supabase snake_case to camelCase)
function mapSupabaseUser(data: any): User {
  return {
    id: data.id,
    clerkId: data.clerk_id,
    email: data.email,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    subscriptionStatus: data.subscription_status,
    subscriptionTier: data.subscription_tier,
    subscriptionEndDate: data.subscription_end_date,
    subscriptionPeriodStart: data.subscription_period_start,
    currentPeriodEnd: data.current_period_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseChild(data: any): Child {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    age: data.age,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseStory(data: any): Story {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    content: data.content,
    length: data.length,
    tone: data.tone,
    wordCount: data.word_count,
    aiProvider: data.ai_provider,
    aiModel: data.ai_model,
    voiceProvider: data.voice_provider,
    voiceConfig: data.voice_config,
    audioUrl: data.audio_url,
    isFavorite: data.is_favorite,
    rating: data.rating,
    qualityScore: data.quality_score,
    feedback: data.feedback,
    regenerationCount: data.regeneration_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseCreditAccount(data: any): CreditAccount {
  return {
    id: data.id,
    userId: data.user_id,
    balance: data.balance,
    lifetimeCredits: data.lifetime_credits,
    tier: data.tier,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseCreditTransaction(data: any): CreditTransaction {
  return {
    id: data.id,
    userId: data.user_id,
    amount: data.amount,
    type: data.type,
    description: data.description,
    balanceAfter: data.balance_after,
    relatedEntityId: data.related_entity_id,
    relatedEntityType: data.related_entity_type,
    metadata: data.metadata,
    createdAt: data.created_at,
  };
}

function mapSupabaseCreditPackage(data: any): CreditPackage {
  return {
    id: data.id,
    name: data.name,
    credits: data.credits,
    bonusCredits: data.bonus_credits,
    priceCents: data.price_cents,
    currency: data.currency,
    description: data.description,
    stripePriceId: data.stripe_price_id,
    isActive: data.is_active,
    isFeatured: data.is_featured,
    sortOrder: data.sort_order,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseSubscription(data: any): UserSubscription {
  return {
    id: data.id,
    userId: data.user_id,
    tier: data.tier,
    status: data.status,
    billingCycle: data.billing_cycle,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    storiesUsed: data.stories_used,
    premiumVoicesUsed: data.premium_voices_used,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    canceledAt: data.canceled_at,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    giftSubscriptionId: data.gift_subscription_id,
    trialEnd: data.trial_end,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseTierLimit(data: any): TierLimit {
  return {
    tierName: data.tier_name,
    monthlyStories: data.monthly_stories,
    monthlyPremiumVoices: data.monthly_premium_voices,
    maxChildren: data.max_children,
    maxSavedStories: data.max_saved_stories,
    features: data.features,
    createdAt: data.created_at,
  };
}

function mapSupabaseUsageTracking(data: any): UsageTrackingEntry {
  return {
    id: data.id,
    userId: data.user_id,
    billingPeriodStart: data.billing_period_start,
    billingPeriodEnd: data.billing_period_end,
    storiesGenerated: data.stories_generated,
    premiumVoicesUsed: data.premium_voices_used,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapSupabaseGiftPackage(data: any): GiftPackage {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    tier: data.tier,
    durationMonths: data.duration_months,
    priceCents: data.price_cents,
    currency: data.currency,
    description: data.description,
    isActive: data.is_active,
    displayOrder: data.display_order,
    createdAt: data.created_at,
  };
}

function mapSupabaseGiftSubscription(data: any): GiftSubscription {
  return {
    id: data.id,
    giftPackageId: data.gift_package_id,
    tier: data.tier,
    durationMonths: data.duration_months,
    pricePaidCents: data.price_paid_cents,
    currency: data.currency,
    status: data.status,
    redemptionCode: data.redemption_code,
    purchaserUserId: data.purchaser_user_id,
    purchaserEmail: data.purchaser_email,
    purchaserName: data.purchaser_name,
    recipientUserId: data.recipient_user_id,
    recipientEmail: data.recipient_email,
    recipientName: data.recipient_name,
    giftMessage: data.gift_message,
    deliveryDate: data.delivery_date,
    redeemedAt: data.redeemed_at,
    expiresAt: data.expires_at,
    stripePaymentIntentId: data.stripe_payment_intent_id,
    stripeCheckoutSessionId: data.stripe_checkout_session_id,
    purchasedAt: data.purchased_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Supabase Database Abstraction Layer
export const supabaseAdapter: DatabaseAbstractionLayer = {
  users: userRepository,
  children: childRepository,
  stories: storyRepository,
  credits: creditRepository,
  subscriptions: subscriptionRepository,
  usage: usageRepository,
  gifts: giftRepository,

  // Supabase doesn't have native transaction support in the JS client
  // This is a limitation - operations run sequentially but not atomically
  async transaction<T>(fn: (tx: DatabaseAbstractionLayer) => Promise<T>): Promise<T> {
    // For Supabase, we just run the function directly
    // True transactions would require using the Postgres function/RPC approach
    console.warn('Supabase adapter: transactions are not atomic, using sequential execution');
    return fn(this);
  },
};
