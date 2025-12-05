import { z } from 'zod';

// =============================================================================
// Zod Validation Schemas for MyAmari 2.0
// =============================================================================

// -------------------------------------------------------------------------
// User Schemas
// -------------------------------------------------------------------------
export const UserIdSchema = z.string().uuid('Invalid user ID');

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  clerkId: z.string().min(1, 'Clerk ID is required'),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// -------------------------------------------------------------------------
// Child Profile Schemas
// -------------------------------------------------------------------------
export const ChildAgeSchema = z.number()
  .int('Age must be a whole number')
  .min(1, 'Age must be at least 1')
  .max(18, 'Age must be 18 or less');

export const ChildInterestsSchema = z.array(
  z.string().min(1).max(50)
).min(1, 'At least one interest is required').max(10, 'Maximum 10 interests');

export const ChildProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  age: ChildAgeSchema,
  avatarUrl: z.string().url().optional(),
  interests: ChildInterestsSchema,
  createdAt: z.string().datetime(),
});

export const CreateChildProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  age: ChildAgeSchema,
  interests: ChildInterestsSchema,
  avatarUrl: z.string().url().optional(),
});

export type ChildProfile = z.infer<typeof ChildProfileSchema>;
export type CreateChildProfileInput = z.infer<typeof CreateChildProfileSchema>;

// -------------------------------------------------------------------------
// Story Schemas
// -------------------------------------------------------------------------
export const StoryThemeSchema = z.enum([
  'adventure',
  'friendship',
  'courage',
  'kindness',
  'discovery',
  'bedtime',
  'learning',
  'fantasy',
  'nature',
  'family',
]);

export const StoryMoodSchema = z.enum([
  'happy',
  'exciting',
  'calm',
  'mysterious',
  'funny',
  'heartwarming',
  'magical',
]);

export const AgeGroupSchema = z.enum(['2-4', '5-7', '8-10', '11-12']);

export const StoryDurationSchema = z.enum(['short', 'medium', 'long']);

export const IllustrationStyleSchema = z.enum([
  'watercolor',
  'cartoon',
  'storybook',
  'realistic',
  'anime',
  'pastel',
]);

export const StoryPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  imagePrompt: z.string().optional(),
});

export const StorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  theme: StoryThemeSchema,
  mood: StoryMoodSchema,
  ageGroup: AgeGroupSchema,
  duration: StoryDurationSchema,
  illustrationStyle: IllustrationStyleSchema.optional(),
  pages: z.array(StoryPageSchema),
  audioUrl: z.string().url().nullable(),
  videoUrl: z.string().url().nullable(),
  creditsUsed: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const CreateStoryRequestSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(50),
  childAge: ChildAgeSchema,
  theme: StoryThemeSchema,
  mood: StoryMoodSchema,
  duration: StoryDurationSchema,
  includeIllustrations: z.boolean().default(true),
  includeNarration: z.boolean().default(false),
  includeVideo: z.boolean().default(false),
  illustrationStyle: IllustrationStyleSchema.optional(),
  customElements: z.array(z.string().max(100)).max(5).optional(),
  characterId: z.string().uuid().optional(), // For character consistency
});

export type Story = z.infer<typeof StorySchema>;
export type StoryPage = z.infer<typeof StoryPageSchema>;
export type CreateStoryRequest = z.infer<typeof CreateStoryRequestSchema>;

// -------------------------------------------------------------------------
// Credit Schemas
// -------------------------------------------------------------------------
export const CreditTierSchema = z.enum([
  'free',
  'starter',
  'pro',
  'family',
  'lifetime',
]);

export const CreditTransactionTypeSchema = z.enum([
  'purchase',
  'usage',
  'bonus',
  'refund',
  'gift',
  'subscription',
  'expiry',
]);

export const CreditAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  balance: z.number().int().nonnegative('Balance cannot be negative'),
  lifetimeCredits: z.number().int().nonnegative(),
  tier: CreditTierSchema,
  stripeCustomerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreditTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().int(), // Can be negative for usage
  type: CreditTransactionTypeSchema,
  description: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
  relatedEntityId: z.string().uuid().optional(), // Story ID, etc.
  createdAt: z.string().datetime(),
});

export const DeductCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive('Amount must be positive'),
  reason: z.string().min(1).max(200),
  relatedEntityId: z.string().uuid().optional(),
});

export const AddCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().positive('Amount must be positive'),
  type: z.enum(['purchase', 'bonus', 'gift', 'subscription']),
  description: z.string().min(1).max(200),
  metadata: z.record(z.unknown()).optional(),
});

export type CreditTier = z.infer<typeof CreditTierSchema>;
export type CreditAccount = z.infer<typeof CreditAccountSchema>;
export type CreditTransaction = z.infer<typeof CreditTransactionSchema>;
export type DeductCreditsInput = z.infer<typeof DeductCreditsSchema>;
export type AddCreditsInput = z.infer<typeof AddCreditsSchema>;

// -------------------------------------------------------------------------
// Credit Cost Configuration
// -------------------------------------------------------------------------
export const CreditCosts = {
  story: {
    short: 5,
    medium: 8,
    long: 12,
  },
  illustration: {
    standard: 3,
    premium: 5,
  },
  narration: {
    basic: 2, // Web Speech API (free)
    premium: 5, // ElevenLabs
  },
  video: {
    short: 20, // 5 seconds
    medium: 40, // 10 seconds
    long: 80, // 20 seconds
  },
} as const;

export const calculateStoryCost = (options: {
  duration: 'short' | 'medium' | 'long';
  pages: number;
  includeIllustrations: boolean;
  illustrationQuality: 'standard' | 'premium';
  includeNarration: boolean;
  narrationQuality: 'basic' | 'premium';
  includeVideo: boolean;
  videoDuration: 'short' | 'medium' | 'long';
}): number => {
  let cost = CreditCosts.story[options.duration];

  if (options.includeIllustrations) {
    cost += options.pages * CreditCosts.illustration[options.illustrationQuality];
  }

  if (options.includeNarration) {
    cost += CreditCosts.narration[options.narrationQuality];
  }

  if (options.includeVideo) {
    cost += CreditCosts.video[options.videoDuration];
  }

  return cost;
};

// -------------------------------------------------------------------------
// API Response Schemas
// -------------------------------------------------------------------------
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    hasMore: z.boolean(),
  });

export type ApiError = z.infer<typeof ApiErrorSchema>;

// -------------------------------------------------------------------------
// Environment Validation
// -------------------------------------------------------------------------
export const EnvSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // AI Providers
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  POSTHOG_API_KEY: z.string().min(1).optional(),

  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate environment variables
 */
export function validateEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
