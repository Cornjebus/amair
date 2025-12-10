import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// =============================================================================
// Rate Limiting Configuration with Upstash Redis
// =============================================================================

// Check if Upstash is configured
export const isRateLimitingEnabled = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Redis client (only if configured)
const redis = isRateLimitingEnabled
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit configurations per operation type (only create if redis is configured)
export const rateLimiters = redis
  ? {
      // Story generation: 10 per minute per user
      storyGeneration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:story',
      }),

      // Image generation: 20 per minute (DALL-E costs ~$0.04/image)
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

      // Video generation: 5 per hour (very expensive!)
      videoGeneration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        analytics: true,
        prefix: 'ratelimit:video',
      }),

      // Gift code redemption: 5 per hour per IP (prevent brute force)
      giftRedemption: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        analytics: true,
        prefix: 'ratelimit:gift',
      }),

      // API general: 100 requests per minute
      apiGeneral: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
      }),
    }
  : null;

export type RateLimiterType = 'storyGeneration' | 'imageGeneration' | 'audioGeneration' | 'videoGeneration' | 'giftRedemption' | 'apiGeneral';

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
 * Returns success: true if rate limiting is not configured (fail open)
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = 'apiGeneral'
): Promise<RateLimitResult> {
  // If rate limiting is not configured, allow all requests
  if (!rateLimiters) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: 0,
    };
  }

  const limiter = rateLimiters[type];
  if (!limiter) {
    console.warn(`[rate-limit] Unknown limiter type: ${type}`);
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: 0,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('[rate-limit] Error checking rate limit:', error);
    // Fail open on error - allow the request
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: 0,
    };
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  identifier: string,
  type: RateLimiterType = 'apiGeneral'
): Promise<{ allowed: boolean; headers: Record<string, string>; result: RateLimitResult }> {
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
    result,
  };
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitResponse(result: RateLimitResult, message?: string): Response {
  const retryAfter = result.retryAfter || 60;

  return Response.json(
    {
      error: message || 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }

  return 'unknown';
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
 * Returns null if redis is not configured
 */
export function createTierRateLimiter(baseLimit: number, windowMs: number, tier: string): Ratelimit | null {
  if (!redis) {
    return null;
  }

  const multiplier = getTierMultiplier(tier);
  const adjustedLimit = Math.floor(baseLimit * multiplier);

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(adjustedLimit, `${windowMs} ms`),
    analytics: true,
  });
}
