import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { creditTransactionTypeEnum } from './enums';

// Credit accounts table - user credit balances (1:1 with users)
export const creditAccounts = pgTable('credit_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: integer('balance').notNull().default(0),
  lifetimeCredits: integer('lifetime_credits').notNull().default(0),
  tier: varchar('tier', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Credit transactions table - audit trail
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: creditTransactionTypeEnum('type').notNull(),
  description: text('description'),
  balanceAfter: integer('balance_after'),
  relatedEntityId: varchar('related_entity_id', { length: 255 }),
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Credit costs table - pricing configuration
export const creditCosts = pgTable('credit_costs', {
  id: uuid('id').defaultRandom().primaryKey(),
  operation: varchar('operation', { length: 100 }).notNull().unique(),
  baseCost: integer('base_cost').notNull(),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Credit packages table - purchasable bundles
export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  credits: integer('credits').notNull(),
  bonusCredits: integer('bonus_credits').default(0),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  description: text('description'),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Credit purchases table - purchase history
export const creditPurchases = pgTable('credit_purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packageId: uuid('package_id').references(() => creditPackages.id),
  creditsPurchased: integer('credits_purchased').notNull(),
  bonusCredits: integer('bonus_credits').default(0),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('pending'),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const creditAccountsRelations = relations(creditAccounts, ({ one }) => ({
  user: one(users, {
    fields: [creditAccounts.userId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const creditPurchasesRelations = relations(creditPurchases, ({ one }) => ({
  user: one(users, {
    fields: [creditPurchases.userId],
    references: [users.id],
  }),
  package: one(creditPackages, {
    fields: [creditPurchases.packageId],
    references: [creditPackages.id],
  }),
}));

// Type exports
export type CreditAccount = typeof creditAccounts.$inferSelect;
export type NewCreditAccount = typeof creditAccounts.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type CreditCost = typeof creditCosts.$inferSelect;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type NewCreditPurchase = typeof creditPurchases.$inferInsert;
