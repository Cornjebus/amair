import { pgEnum } from 'drizzle-orm/pg-core';

// Credit transaction types
export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', [
  'purchase',
  'usage',
  'bonus',
  'refund',
  'gift',
  'subscription',
  'adjustment',
]);

// Story length options
export const storyLengthEnum = pgEnum('story_length', [
  'quick',
  'medium',
  'epic',
]);

// Story tone options
export const storyToneEnum = pgEnum('story_tone', [
  'bedtime-calm',
  'funny',
  'adventure',
  'mystery',
]);

// Subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'free',
  'premium',
  'trial',
]);

// Subscription tiers
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'dream_weaver',
  'magic_circle',
  'enchanted_library',
]);

// Type exports for use in application code
export type CreditTransactionType = (typeof creditTransactionTypeEnum.enumValues)[number];
export type StoryLength = (typeof storyLengthEnum.enumValues)[number];
export type StoryTone = (typeof storyToneEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
export type SubscriptionTier = (typeof subscriptionTierEnum.enumValues)[number];
