import { pgTable, uuid, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { subscriptionStatusEnum, subscriptionTierEnum } from './enums';

// Users table - primary entity linked to Clerk auth
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum('subscription_status'),
  subscriptionTier: subscriptionTierEnum('subscription_tier'),
  subscriptionEndDate: timestamp('subscription_end_date', { mode: 'string' }),
  subscriptionPeriodStart: timestamp('subscription_period_start', { mode: 'string' }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'string' }),
  preferredAiProvider: varchar('preferred_ai_provider', { length: 50 }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Children table - child profiles for personalized stories
export const children = pgTable('children', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  children: many(children),
}));

export const childrenRelations = relations(children, ({ one }) => ({
  user: one(users, {
    fields: [children.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
