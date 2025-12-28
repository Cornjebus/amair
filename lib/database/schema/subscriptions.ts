import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { subscriptionTierEnum } from './enums';

// User subscriptions table - current subscription state (1:1 with users)
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  tier: subscriptionTierEnum('tier').notNull().default('free'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  billingCycle: varchar('billing_cycle', { length: 20 }),
  currentPeriodStart: timestamp('current_period_start', { mode: 'string' }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'string' }).notNull(),
  storiesUsed: integer('stories_used').default(0),
  premiumVoicesUsed: integer('premium_voices_used').default(0),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at', { mode: 'string' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  giftSubscriptionId: uuid('gift_subscription_id'),
  trialEnd: timestamp('trial_end', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Subscription prices table - pricing per tier/cycle
export const subscriptionPrices = pgTable('subscription_prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  tier: subscriptionTierEnum('tier').notNull(),
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Tier limits table - feature limits per tier
export const tierLimits = pgTable('tier_limits', {
  tierName: subscriptionTierEnum('tier_name').primaryKey(),
  monthlyStories: integer('monthly_stories').notNull(),
  monthlyPremiumVoices: integer('monthly_premium_voices').notNull(),
  maxChildren: integer('max_children').notNull(),
  maxSavedStories: integer('max_saved_stories').notNull(),
  features: jsonb('features'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Subscription history table - audit trail
export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  fromTier: subscriptionTierEnum('from_tier'),
  toTier: subscriptionTierEnum('to_tier'),
  billingCycle: varchar('billing_cycle', { length: 20 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Usage tracking table - per-billing-period usage
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  billingPeriodStart: date('billing_period_start').notNull(),
  billingPeriodEnd: date('billing_period_end').notNull(),
  storiesGenerated: integer('stories_generated').default(0),
  premiumVoicesUsed: integer('premium_voices_used').default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionHistory.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

// Type exports
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type SubscriptionPrice = typeof subscriptionPrices.$inferSelect;
export type TierLimit = typeof tierLimits.$inferSelect;
export type SubscriptionHistoryEntry = typeof subscriptionHistory.$inferSelect;
export type UsageTrackingEntry = typeof usageTracking.$inferSelect;
export type NewUsageTrackingEntry = typeof usageTracking.$inferInsert;
