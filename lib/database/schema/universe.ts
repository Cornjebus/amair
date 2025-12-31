import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { stories } from './stories';

// Family universes table - aggregate stats and settings for each family's story universe
export const familyUniverses = pgTable('family_universes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  universeName: text('universe_name').default('My Story Universe'),
  description: text('description'),
  totalStories: integer('total_stories').default(0),
  totalCharacters: integer('total_characters').default(0),
  totalWordsGenerated: integer('total_words_generated').default(0),
  favoriteThemes: text('favorite_themes').array(),
  defaultArtStyle: text('default_art_style').default('storybook'),
  defaultTone: text('default_tone').default('bedtime-calm'),
  enableCharacterContinuity: boolean('enable_character_continuity').default(true),
  enableStoryCallbacks: boolean('enable_story_callbacks').default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Characters table - recurring characters that can appear in multiple stories
export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nickname: text('nickname'),
  gender: text('gender'),
  ageRange: text('age_range'),
  description: text('description'),
  personality: text('personality'),
  favoriteThings: text('favorite_things').array(),
  role: text('role').default('protagonist'),
  avatarUrl: text('avatar_url'),
  illustrationStyle: text('illustration_style'),
  storiesCount: integer('stories_count').default(0),
  lastAppearedAt: timestamp('last_appeared_at', { mode: 'string' }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow(),
});

// Story characters join table
export const storyCharacters = pgTable('story_characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  roleInStory: text('role_in_story'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Story memories table - AI-generated summaries for context
export const storyMemories = pgTable('story_memories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: uuid('story_id').references(() => stories.id, { onDelete: 'set null' }),
  memoryType: text('memory_type').notNull(),
  summary: text('summary').notNull(),
  importance: integer('importance').default(5),
  characterIds: uuid('character_ids').array(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
});

// Relations
export const familyUniversesRelations = relations(familyUniverses, ({ one }) => ({
  user: one(users, {
    fields: [familyUniverses.userId],
    references: [users.id],
  }),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  storyAppearances: many(storyCharacters),
}));

export const storyCharactersRelations = relations(storyCharacters, ({ one }) => ({
  story: one(stories, {
    fields: [storyCharacters.storyId],
    references: [stories.id],
  }),
  character: one(characters, {
    fields: [storyCharacters.characterId],
    references: [characters.id],
  }),
}));

export const storyMemoriesRelations = relations(storyMemories, ({ one }) => ({
  user: one(users, {
    fields: [storyMemories.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [storyMemories.storyId],
    references: [stories.id],
  }),
}));

// Type exports
export type FamilyUniverse = typeof familyUniverses.$inferSelect;
export type NewFamilyUniverse = typeof familyUniverses.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type StoryCharacter = typeof storyCharacters.$inferSelect;
export type NewStoryCharacter = typeof storyCharacters.$inferInsert;
export type StoryMemory = typeof storyMemories.$inferSelect;
export type NewStoryMemory = typeof storyMemories.$inferInsert;
