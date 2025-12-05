import { faker } from '@faker-js/faker';

// =============================================================================
// Test Fixtures with Faker.js
// =============================================================================

// Set seed for reproducible tests
faker.seed(12345);

// -------------------------------------------------------------------------
// User Fixtures
// -------------------------------------------------------------------------
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: faker.string.uuid(),
  clerkId: `user_${faker.string.alphanumeric(24)}`,
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  avatarUrl: faker.image.avatar(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export interface MockUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------------
// Child Profile Fixtures
// -------------------------------------------------------------------------
export const createMockChildProfile = (overrides: Partial<MockChildProfile> = {}): MockChildProfile => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  name: faker.person.firstName(),
  age: faker.number.int({ min: 2, max: 12 }),
  avatarUrl: faker.image.avatar(),
  interests: faker.helpers.arrayElements(
    ['dinosaurs', 'space', 'animals', 'magic', 'sports', 'music', 'art'],
    { min: 1, max: 4 }
  ),
  createdAt: faker.date.past().toISOString(),
  ...overrides,
});

export interface MockChildProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  avatarUrl: string;
  interests: string[];
  createdAt: string;
}

// -------------------------------------------------------------------------
// Story Fixtures
// -------------------------------------------------------------------------
export const createMockStory = (overrides: Partial<MockStory> = {}): MockStory => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  childProfileId: faker.string.uuid(),
  title: `The ${faker.word.adjective()} ${faker.animal.type()}`,
  content: faker.lorem.paragraphs(5),
  theme: faker.helpers.arrayElement(['adventure', 'friendship', 'courage', 'kindness', 'discovery']),
  mood: faker.helpers.arrayElement(['happy', 'exciting', 'calm', 'mysterious', 'funny']),
  ageGroup: faker.helpers.arrayElement(['2-4', '5-7', '8-10', '11-12']),
  duration: faker.helpers.arrayElement(['short', 'medium', 'long']),
  illustrationStyle: faker.helpers.arrayElement(['watercolor', 'cartoon', 'storybook', 'realistic']),
  pages: Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, (_, i) => ({
    pageNumber: i + 1,
    text: faker.lorem.paragraph(),
    imageUrl: faker.image.url(),
  })),
  audioUrl: faker.internet.url(),
  videoUrl: null,
  creditsUsed: faker.number.int({ min: 5, max: 50 }),
  createdAt: faker.date.past().toISOString(),
  ...overrides,
});

export interface MockStory {
  id: string;
  userId: string;
  childProfileId: string;
  title: string;
  content: string;
  theme: string;
  mood: string;
  ageGroup: string;
  duration: string;
  illustrationStyle: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imageUrl: string;
  }>;
  audioUrl: string | null;
  videoUrl: string | null;
  creditsUsed: number;
  createdAt: string;
}

// -------------------------------------------------------------------------
// Credit Account Fixtures
// -------------------------------------------------------------------------
export const createMockCreditAccount = (overrides: Partial<MockCreditAccount> = {}): MockCreditAccount => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  balance: faker.number.int({ min: 0, max: 1000 }),
  lifetimeCredits: faker.number.int({ min: 100, max: 5000 }),
  tier: faker.helpers.arrayElement(['free', 'starter', 'pro', 'family', 'lifetime']),
  stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export interface MockCreditAccount {
  id: string;
  userId: string;
  balance: number;
  lifetimeCredits: number;
  tier: string;
  stripeCustomerId: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------------
// Credit Transaction Fixtures
// -------------------------------------------------------------------------
export const createMockCreditTransaction = (overrides: Partial<MockCreditTransaction> = {}): MockCreditTransaction => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  amount: faker.number.int({ min: -50, max: 500 }),
  type: faker.helpers.arrayElement(['purchase', 'usage', 'bonus', 'refund', 'gift']),
  description: faker.lorem.sentence(),
  metadata: {},
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

export interface MockCreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// -------------------------------------------------------------------------
// AI Generation Request Fixtures
// -------------------------------------------------------------------------
export const createMockStoryRequest = (overrides: Partial<MockStoryRequest> = {}): MockStoryRequest => ({
  childName: faker.person.firstName(),
  childAge: faker.number.int({ min: 2, max: 12 }),
  theme: faker.helpers.arrayElement(['adventure', 'friendship', 'bedtime', 'learning']),
  mood: faker.helpers.arrayElement(['happy', 'calm', 'exciting']),
  duration: faker.helpers.arrayElement(['short', 'medium', 'long']),
  includeIllustrations: faker.datatype.boolean(),
  includeNarration: faker.datatype.boolean(),
  illustrationStyle: faker.helpers.arrayElement(['watercolor', 'cartoon', 'storybook']),
  customElements: faker.helpers.arrayElements(
    ['favorite toy', 'pet', 'best friend', 'magical creature'],
    { min: 0, max: 2 }
  ),
  ...overrides,
});

export interface MockStoryRequest {
  childName: string;
  childAge: number;
  theme: string;
  mood: string;
  duration: string;
  includeIllustrations: boolean;
  includeNarration: boolean;
  illustrationStyle: string;
  customElements: string[];
}

// -------------------------------------------------------------------------
// API Response Fixtures
// -------------------------------------------------------------------------
export const createMockOpenAIResponse = () => ({
  id: `chatcmpl-${faker.string.alphanumeric(29)}`,
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: 'gpt-4o',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: faker.lorem.paragraphs(3),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: faker.number.int({ min: 50, max: 200 }),
    completion_tokens: faker.number.int({ min: 100, max: 500 }),
    total_tokens: faker.number.int({ min: 150, max: 700 }),
  },
});

export const createMockClaudeResponse = () => ({
  id: `msg_${faker.string.alphanumeric(24)}`,
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: faker.lorem.paragraphs(3),
    },
  ],
  model: 'claude-sonnet-4-5-20250514',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: faker.number.int({ min: 50, max: 200 }),
    output_tokens: faker.number.int({ min: 100, max: 500 }),
  },
});

// -------------------------------------------------------------------------
// Batch Fixtures (for testing lists)
// -------------------------------------------------------------------------
export const createMockUsers = (count: number = 5): MockUser[] =>
  Array.from({ length: count }, () => createMockUser());

export const createMockStories = (count: number = 5, userId?: string): MockStory[] =>
  Array.from({ length: count }, () => createMockStory(userId ? { userId } : {}));

export const createMockChildProfiles = (count: number = 3, userId?: string): MockChildProfile[] =>
  Array.from({ length: count }, () => createMockChildProfile(userId ? { userId } : {}));

export const createMockTransactions = (count: number = 10, userId?: string): MockCreditTransaction[] =>
  Array.from({ length: count }, () => createMockCreditTransaction(userId ? { userId } : {}));
