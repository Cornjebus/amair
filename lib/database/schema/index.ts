// Enums
export * from './enums';

// Tables
export * from './users';
export * from './stories';
export * from './credits';
export * from './subscriptions';
export * from './gifts';

// Re-export all tables for schema inference
import { users, children } from './users';
import { stories, storySeeds, dailyChallenges } from './stories';
import { creditAccounts, creditTransactions, creditCosts, creditPackages, creditPurchases } from './credits';
import { userSubscriptions, subscriptionPrices, tierLimits, subscriptionHistory, usageTracking } from './subscriptions';
import { giftPackages, giftSubscriptions } from './gifts';

// Combined schema export for Drizzle
export const schema = {
  // Users
  users,
  children,
  // Stories
  stories,
  storySeeds,
  dailyChallenges,
  // Credits
  creditAccounts,
  creditTransactions,
  creditCosts,
  creditPackages,
  creditPurchases,
  // Subscriptions
  userSubscriptions,
  subscriptionPrices,
  tierLimits,
  subscriptionHistory,
  usageTracking,
  // Gifts
  giftPackages,
  giftSubscriptions,
};
