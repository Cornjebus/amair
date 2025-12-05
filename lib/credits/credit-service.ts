import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreditAccount,
  CreditTransaction,
  DeductCreditsInput,
  AddCreditsInput,
  CreditCosts,
} from '@/lib/validations/schemas';

// =============================================================================
// Credit Service - TDD Implementation
// =============================================================================

// Custom Errors
export class CreditServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CreditServiceError';
  }
}

export class InsufficientCreditsError extends CreditServiceError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_CREDITS'
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class CreditAccountNotFoundError extends CreditServiceError {
  constructor(userId: string) {
    super(`Credit account not found for user: ${userId}`, 'ACCOUNT_NOT_FOUND');
    this.name = 'CreditAccountNotFoundError';
  }
}

// Types
interface DeductResult {
  newBalance: number;
  amountDeducted: number;
  transactionId: string;
}

interface AddResult {
  newBalance: number;
  amountAdded: number;
  transactionId: string;
}

interface TransactionHistoryOptions {
  page?: number;
  pageSize?: number;
}

interface TransactionHistoryResult {
  items: CreditTransaction[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface CalculateStoryCostOptions {
  duration: 'short' | 'medium' | 'long';
  pages: number;
  includeIllustrations: boolean;
  illustrationQuality?: 'standard' | 'premium';
  includeNarration: boolean;
  narrationQuality?: 'basic' | 'premium';
  includeVideo: boolean;
  videoDuration?: 'short' | 'medium' | 'long';
}

// Constants
const WELCOME_BONUS_CREDITS = 10;

export class CreditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the current credit balance for a user
   */
  async getBalance(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('credit_accounts')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new CreditAccountNotFoundError(userId);
    }

    return data.balance;
  }

  /**
   * Check if user has enough credits for an operation
   */
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct credits from a user's account
   */
  async deductCredits(input: DeductCreditsInput): Promise<DeductResult> {
    const { userId, amount, reason, relatedEntityId } = input;

    // Validate amount
    if (amount <= 0) {
      throw new CreditServiceError('Amount must be positive', 'INVALID_AMOUNT');
    }

    // Get current balance
    const { data: account, error: fetchError } = await this.supabase
      .from('credit_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !account) {
      throw new CreditAccountNotFoundError(userId);
    }

    // Check sufficient balance
    if (account.balance < amount) {
      throw new InsufficientCreditsError(amount, account.balance);
    }

    const newBalance = account.balance - amount;

    // Update balance
    const { error: updateError } = await this.supabase
      .from('credit_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new CreditServiceError('Failed to update balance', 'UPDATE_FAILED');
    }

    // Create transaction record
    const { data: transaction, error: txError } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description: reason,
        related_entity_id: relatedEntityId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      throw new CreditServiceError('Failed to create transaction', 'TRANSACTION_FAILED');
    }

    return {
      newBalance,
      amountDeducted: amount,
      transactionId: transaction.id,
    };
  }

  /**
   * Add credits to a user's account
   */
  async addCredits(input: AddCreditsInput): Promise<AddResult> {
    const { userId, amount, type, description, metadata } = input;

    // Validate amount
    if (amount <= 0) {
      throw new CreditServiceError('Amount must be positive', 'INVALID_AMOUNT');
    }

    // Get current account
    const { data: account, error: fetchError } = await this.supabase
      .from('credit_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !account) {
      throw new CreditAccountNotFoundError(userId);
    }

    const newBalance = account.balance + amount;
    const newLifetimeCredits = type === 'purchase'
      ? account.lifetime_credits + amount
      : account.lifetime_credits;

    // Update balance
    const { error: updateError } = await this.supabase
      .from('credit_accounts')
      .update({
        balance: newBalance,
        lifetime_credits: newLifetimeCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new CreditServiceError('Failed to update balance', 'UPDATE_FAILED');
    }

    // Create transaction record
    const { data: transaction, error: txError } = await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount,
        type,
        description,
        metadata,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      throw new CreditServiceError('Failed to create transaction', 'TRANSACTION_FAILED');
    }

    return {
      newBalance,
      amountAdded: amount,
      transactionId: transaction.id,
    };
  }

  /**
   * Create a new credit account for a user
   */
  async createAccount(userId: string, tier: string = 'free'): Promise<CreditAccount> {
    // Create account with welcome bonus
    const { data: account, error: createError } = await this.supabase
      .from('credit_accounts')
      .insert({
        user_id: userId,
        balance: WELCOME_BONUS_CREDITS,
        lifetime_credits: WELCOME_BONUS_CREDITS,
        tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new CreditServiceError('Failed to create account', 'CREATE_FAILED');
    }

    // Create welcome bonus transaction
    await this.supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: WELCOME_BONUS_CREDITS,
        type: 'bonus',
        description: 'Welcome bonus credits',
        created_at: new Date().toISOString(),
      });

    return account;
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    options: TransactionHistoryOptions = {}
  ): Promise<TransactionHistoryResult> {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const { data: items, error, count } = await this.supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new CreditServiceError('Failed to fetch transactions', 'FETCH_FAILED');
    }

    return {
      items: items || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    };
  }

  /**
   * Calculate the cost of generating a story
   */
  calculateStoryCost(options: CalculateStoryCostOptions): number {
    let cost = CreditCosts.story[options.duration];

    if (options.includeIllustrations) {
      const quality = options.illustrationQuality || 'standard';
      cost += options.pages * CreditCosts.illustration[quality];
    }

    if (options.includeNarration) {
      const quality = options.narrationQuality || 'basic';
      cost += CreditCosts.narration[quality];
    }

    if (options.includeVideo && options.videoDuration) {
      cost += CreditCosts.video[options.videoDuration];
    }

    return cost;
  }

  /**
   * Get the full account details for a user
   */
  async getAccount(userId: string): Promise<CreditAccount> {
    const { data, error } = await this.supabase
      .from('credit_accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new CreditAccountNotFoundError(userId);
    }

    return data;
  }

  /**
   * Upgrade user tier
   */
  async upgradeTier(userId: string, newTier: string, bonusCredits: number = 0): Promise<CreditAccount> {
    const account = await this.getAccount(userId);
    // Note: account from DB uses snake_case, but our type uses camelCase
    const currentLifetimeCredits = (account as unknown as { lifetime_credits?: number }).lifetime_credits ?? account.lifetimeCredits ?? 0;

    const { data: updated, error } = await this.supabase
      .from('credit_accounts')
      .update({
        tier: newTier,
        balance: account.balance + bonusCredits,
        lifetime_credits: currentLifetimeCredits + bonusCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new CreditServiceError('Failed to upgrade tier', 'UPGRADE_FAILED');
    }

    // Create bonus transaction if applicable
    if (bonusCredits > 0) {
      await this.supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: bonusCredits,
          type: 'bonus',
          description: `Tier upgrade bonus (${newTier})`,
          created_at: new Date().toISOString(),
        });
    }

    return updated;
  }
}

// Export singleton factory
export function createCreditService(supabase: SupabaseClient): CreditService {
  return new CreditService(supabase);
}
