import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { subscriptionTierEnum } from './enums';

// Gift packages table - purchasable gift bundles
export const giftPackages = pgTable('gift_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  tier: subscriptionTierEnum('tier').notNull(),
  durationMonths: integer('duration_months').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Gift subscriptions table - gift purchase and redemption tracking
export const giftSubscriptions = pgTable('gift_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  giftPackageId: uuid('gift_package_id').notNull().references(() => giftPackages.id),
  tier: subscriptionTierEnum('tier').notNull(),
  durationMonths: integer('duration_months').notNull(),
  pricePaidCents: integer('price_paid_cents').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  redemptionCode: varchar('redemption_code', { length: 50 }).notNull().unique(),
  purchaserUserId: uuid('purchaser_user_id').references(() => users.id),
  purchaserEmail: varchar('purchaser_email', { length: 255 }).notNull(),
  purchaserName: varchar('purchaser_name', { length: 255 }),
  recipientUserId: uuid('recipient_user_id').references(() => users.id),
  recipientEmail: varchar('recipient_email', { length: 255 }),
  recipientName: varchar('recipient_name', { length: 255 }),
  giftMessage: text('gift_message'),
  deliveryDate: timestamp('delivery_date', { mode: 'string' }),
  redeemedAt: timestamp('redeemed_at', { mode: 'string' }),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }),
  purchasedAt: timestamp('purchased_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const giftPackagesRelations = relations(giftPackages, ({ many }) => ({
  subscriptions: many(giftSubscriptions),
}));

export const giftSubscriptionsRelations = relations(giftSubscriptions, ({ one }) => ({
  giftPackage: one(giftPackages, {
    fields: [giftSubscriptions.giftPackageId],
    references: [giftPackages.id],
  }),
  purchaser: one(users, {
    fields: [giftSubscriptions.purchaserUserId],
    references: [users.id],
    relationName: 'purchaser',
  }),
  recipient: one(users, {
    fields: [giftSubscriptions.recipientUserId],
    references: [users.id],
    relationName: 'recipient',
  }),
}));

// Type exports
export type GiftPackage = typeof giftPackages.$inferSelect;
export type NewGiftPackage = typeof giftPackages.$inferInsert;
export type GiftSubscription = typeof giftSubscriptions.$inferSelect;
export type NewGiftSubscription = typeof giftSubscriptions.$inferInsert;
