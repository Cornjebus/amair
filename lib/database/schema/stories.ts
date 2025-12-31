import { pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { storyLengthEnum, storyToneEnum } from './enums';

// Stories table - generated stories
export const stories = pgTable('stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  length: storyLengthEnum('length').notNull(),
  tone: storyToneEnum('tone').notNull(),
  wordCount: integer('word_count').notNull(),
  aiProvider: varchar('ai_provider', { length: 50 }),
  aiModel: varchar('ai_model', { length: 100 }),
  voiceProvider: varchar('voice_provider', { length: 50 }),
  voiceConfig: jsonb('voice_config'),
  audioUrl: varchar('audio_url', { length: 1000 }),
  isFavorite: boolean('is_favorite').default(false),
  rating: integer('rating'),
  qualityScore: integer('quality_score'),
  feedback: text('feedback'),
  regenerationCount: integer('regeneration_count').default(0),
  artStyle: varchar('art_style', { length: 50 }),
  hasIllustrations: boolean('has_illustrations').default(false),
  illustrationCount: integer('illustration_count').default(0),
  generationCost: integer('generation_cost'),
  tokensUsed: integer('tokens_used'),
  ratedAt: timestamp('rated_at', { mode: 'string' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Story seeds table - items used to generate stories
export const storySeeds = pgTable('story_seeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  childName: varchar('child_name', { length: 255 }).notNull(),
  seedItems: text('seed_items').array().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Daily challenges table
export const dailyChallenges = pgTable('daily_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeItems: text('challenge_items').array().notNull(),
  childStory: text('child_story'),
  completedAt: timestamp('completed_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  seeds: many(storySeeds),
}));

export const storySeedsRelations = relations(storySeeds, ({ one }) => ({
  story: one(stories, {
    fields: [storySeeds.storyId],
    references: [stories.id],
  }),
}));

export const dailyChallengesRelations = relations(dailyChallenges, ({ one }) => ({
  user: one(users, {
    fields: [dailyChallenges.userId],
    references: [users.id],
  }),
}));

// Type exports
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
export type StorySeed = typeof storySeeds.$inferSelect;
export type NewStorySeed = typeof storySeeds.$inferInsert;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type NewDailyChallenge = typeof dailyChallenges.$inferInsert;
