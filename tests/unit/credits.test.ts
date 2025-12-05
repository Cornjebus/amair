import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CreditService,
  InsufficientCreditsError,
  CreditAccountNotFoundError,
} from '@/lib/credits/credit-service';
import { createMockCreditAccount, createMockUser } from '../fixtures';

// =============================================================================
// TDD Tests for Credit Service
// Red-Green-Refactor: Write failing tests first, then implement
// =============================================================================

describe('CreditService', () => {
  let creditService: CreditService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  // Create mock Supabase client
  function createMockSupabase() {
    return {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };
  }

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    creditService = new CreditService(mockSupabase as unknown as Parameters<typeof CreditService>[0]);
  });

  // -------------------------------------------------------------------------
  // getBalance Tests
  // -------------------------------------------------------------------------
  describe('getBalance', () => {
    it('should return the credit balance for a user', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 100 });
      mockSupabase.single.mockResolvedValue({ data: mockAccount, error: null });

      // Act
      const balance = await creditService.getBalance(mockAccount.userId);

      // Assert
      expect(balance).toBe(100);
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_accounts');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockAccount.userId);
    });

    it('should throw CreditAccountNotFoundError if account does not exist', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Act & Assert
      await expect(creditService.getBalance('non-existent-user'))
        .rejects.toThrow(CreditAccountNotFoundError);
    });

    it('should return 0 for new users with free tier', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 0, tier: 'free' });
      mockSupabase.single.mockResolvedValue({ data: mockAccount, error: null });

      // Act
      const balance = await creditService.getBalance(mockAccount.userId);

      // Assert
      expect(balance).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // deductCredits Tests
  // -------------------------------------------------------------------------
  describe('deductCredits', () => {
    it('should deduct credits and return new balance', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 100 });
      mockSupabase.single.mockResolvedValueOnce({ data: mockAccount, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...mockAccount, balance: 90 }, error: null });

      // Act
      const result = await creditService.deductCredits({
        userId: mockAccount.userId,
        amount: 10,
        reason: 'Story generation',
      });

      // Assert
      expect(result.newBalance).toBe(90);
      expect(result.amountDeducted).toBe(10);
    });

    it('should throw InsufficientCreditsError when balance is too low', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 5 });
      mockSupabase.single.mockResolvedValue({ data: mockAccount, error: null });

      // Act & Assert
      await expect(creditService.deductCredits({
        userId: mockAccount.userId,
        amount: 10,
        reason: 'Story generation',
      })).rejects.toThrow(InsufficientCreditsError);
    });

    it('should create a transaction record when deducting credits', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 100 });
      mockSupabase.single.mockResolvedValueOnce({ data: mockAccount, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...mockAccount, balance: 90 }, error: null });

      // Act
      await creditService.deductCredits({
        userId: mockAccount.userId,
        amount: 10,
        reason: 'Story generation',
        relatedEntityId: 'story-123',
      });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_transactions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockAccount.userId,
        amount: -10,
        type: 'usage',
        description: 'Story generation',
        related_entity_id: 'story-123',
      }));
    });

    it('should not allow negative deduction amounts', async () => {
      // Act & Assert
      await expect(creditService.deductCredits({
        userId: 'user-123',
        amount: -10,
        reason: 'Invalid deduction',
      })).rejects.toThrow('Amount must be positive');
    });
  });

  // -------------------------------------------------------------------------
  // addCredits Tests
  // -------------------------------------------------------------------------
  describe('addCredits', () => {
    it('should add credits and return new balance', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 50 });
      mockSupabase.single.mockResolvedValueOnce({ data: mockAccount, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...mockAccount, balance: 150 }, error: null });

      // Act
      const result = await creditService.addCredits({
        userId: mockAccount.userId,
        amount: 100,
        type: 'purchase',
        description: 'Credit pack purchase',
      });

      // Assert
      expect(result.newBalance).toBe(150);
      expect(result.amountAdded).toBe(100);
    });

    it('should update lifetimeCredits when adding purchased credits', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 50, lifetimeCredits: 200 });
      // Mock the account with snake_case as returned from DB
      const dbAccount = { ...mockAccount, lifetime_credits: 200 };
      mockSupabase.single.mockResolvedValueOnce({ data: dbAccount, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...dbAccount, balance: 150, lifetime_credits: 300 },
        error: null
      });

      // Act
      await creditService.addCredits({
        userId: mockAccount.userId,
        amount: 100,
        type: 'purchase',
        description: 'Credit pack purchase',
      });

      // Assert
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        balance: 150,
        lifetime_credits: 300,
      }));
    });

    it('should create a transaction record when adding credits', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 50 });
      mockSupabase.single.mockResolvedValueOnce({ data: mockAccount, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...mockAccount, balance: 150 }, error: null });

      // Act
      await creditService.addCredits({
        userId: mockAccount.userId,
        amount: 100,
        type: 'purchase',
        description: 'Credit pack purchase',
        metadata: { stripePaymentId: 'pi_123' },
      });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_transactions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockAccount.userId,
        amount: 100,
        type: 'purchase',
        description: 'Credit pack purchase',
        metadata: { stripePaymentId: 'pi_123' },
      }));
    });
  });

  // -------------------------------------------------------------------------
  // createAccount Tests
  // -------------------------------------------------------------------------
  describe('createAccount', () => {
    it('should create a new credit account with default values', async () => {
      // Arrange
      const user = createMockUser();
      const newAccount = createMockCreditAccount({
        userId: user.id,
        balance: 10, // Welcome bonus
        tier: 'free',
      });
      mockSupabase.single.mockResolvedValue({ data: newAccount, error: null });

      // Act
      const account = await creditService.createAccount(user.id);

      // Assert
      expect(account.balance).toBe(10);
      expect(account.tier).toBe('free');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: user.id,
        balance: 10,
        tier: 'free',
      }));
    });

    it('should create welcome bonus transaction', async () => {
      // Arrange
      const user = createMockUser();
      const newAccount = createMockCreditAccount({ userId: user.id, balance: 10 });
      mockSupabase.single.mockResolvedValue({ data: newAccount, error: null });

      // Act
      await creditService.createAccount(user.id);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('credit_transactions');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: user.id,
        amount: 10,
        type: 'bonus',
        description: 'Welcome bonus credits',
      }));
    });
  });

  // -------------------------------------------------------------------------
  // getTransactionHistory Tests
  // -------------------------------------------------------------------------
  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      // Arrange
      const userId = 'user-123';
      const mockTransactions = [
        { id: '1', amount: -10, type: 'usage', created_at: new Date().toISOString() },
        { id: '2', amount: 100, type: 'purchase', created_at: new Date().toISOString() },
      ];
      // Mock range to return data with count
      mockSupabase.range.mockResolvedValue({
        data: mockTransactions,
        error: null,
        count: 2
      });

      // Act
      const history = await creditService.getTransactionHistory(userId, { page: 1, pageSize: 10 });

      // Assert
      expect(history.items).toHaveLength(2);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  // -------------------------------------------------------------------------
  // calculateStoryCost Tests
  // -------------------------------------------------------------------------
  describe('calculateStoryCost', () => {
    it('should calculate correct cost for basic story', () => {
      // Act
      const cost = creditService.calculateStoryCost({
        duration: 'short',
        pages: 4,
        includeIllustrations: true,
        illustrationQuality: 'standard',
        includeNarration: false,
        includeVideo: false,
      });

      // Assert: 5 (story) + 4*3 (illustrations) = 17
      expect(cost).toBe(17);
    });

    it('should calculate correct cost for premium story with all features', () => {
      // Act
      const cost = creditService.calculateStoryCost({
        duration: 'long',
        pages: 8,
        includeIllustrations: true,
        illustrationQuality: 'premium',
        includeNarration: true,
        narrationQuality: 'premium',
        includeVideo: true,
        videoDuration: 'medium',
      });

      // Assert: 12 (story) + 8*5 (illustrations) + 5 (narration) + 40 (video) = 97
      expect(cost).toBe(97);
    });

    it('should return base story cost without optional features', () => {
      // Act
      const cost = creditService.calculateStoryCost({
        duration: 'medium',
        pages: 6,
        includeIllustrations: false,
        includeNarration: false,
        includeVideo: false,
      });

      // Assert: 8 (story only)
      expect(cost).toBe(8);
    });
  });

  // -------------------------------------------------------------------------
  // hasEnoughCredits Tests
  // -------------------------------------------------------------------------
  describe('hasEnoughCredits', () => {
    it('should return true when user has enough credits', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 100 });
      mockSupabase.single.mockResolvedValue({ data: mockAccount, error: null });

      // Act
      const result = await creditService.hasEnoughCredits(mockAccount.userId, 50);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have enough credits', async () => {
      // Arrange
      const mockAccount = createMockCreditAccount({ balance: 30 });
      mockSupabase.single.mockResolvedValue({ data: mockAccount, error: null });

      // Act
      const result = await creditService.hasEnoughCredits(mockAccount.userId, 50);

      // Assert
      expect(result).toBe(false);
    });
  });
});
