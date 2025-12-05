import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// =============================================================================
// Rate Limiting Configuration with Upstash Redis
// =============================================================================

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit configurations per operation type
export const rateLimiters = {
  // Story generation: 10 per minute for free, 30 for pro
  storyGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:story',
  }),

  // Image generation: 20 per minute
  imageGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:image',
  }),

  // Audio generation: 15 per minute
  audioGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, '1 m'),
    analytics: true,
    prefix: 'ratelimit:audio',
  }),

  // Video generation: 5 per hour (expensive!)
  videoGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:video',
  }),

  // API general: 100 requests per minute
  apiGeneral: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
};

export type RateLimiterType = keyof typeof rateLimiters;

// Rate limit check result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier and limiter type
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = 'apiGeneral'
): Promise<RateLimitResult> {
  const limiter = rateLimiters[type];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  identifier: string,
  type: RateLimiterType = 'apiGeneral'
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const result = await checkRateLimit(identifier, type);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.success,
    headers,
  };
}

/**
 * Get tier-based rate limit multiplier
 */
export function getTierMultiplier(tier: string): number {
  switch (tier) {
    case 'lifetime':
    case 'family':
      return 3;
    case 'pro':
      return 2;
    case 'starter':
      return 1.5;
    default:
      return 1;
  }
}

/**
 * Create a tier-aware rate limiter
 */
export function createTierRateLimiter(baseLimit: number, windowMs: number, tier: string) {
  const multiplier = getTierMultiplier(tier);
  const adjustedLimit = Math.floor(baseLimit * multiplier);

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(adjustedLimit, `${windowMs} ms`),
    analytics: true,
  });
}
