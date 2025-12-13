import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logging';

// =============================================================================
// Rate Limiting Configuration with Upstash Redis
// =============================================================================
// SECURITY: Implements fail-CLOSED behavior - when Redis is unavailable,
// requests are denied to prevent abuse during outages.

// Check if Upstash is configured
export const isRateLimitingEnabled = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// In-memory fallback rate limiter for when Redis is unavailable
// Uses a simple sliding window with Map storage
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  async checkLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: entry.resetTime };
    }

    entry.count++;
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - entry.count, reset: entry.resetTime };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Fallback limiters (more restrictive than Redis-based ones for safety)
const fallbackLimiters = {
  storyGeneration: new InMemoryRateLimiter(5, 60000), // 5 per minute (reduced from 10)
  imageGeneration: new InMemoryRateLimiter(10, 60000), // 10 per minute (reduced from 20)
  audioGeneration: new InMemoryRateLimiter(8, 60000), // 8 per minute (reduced from 15)
  videoGeneration: new InMemoryRateLimiter(2, 3600000), // 2 per hour (reduced from 5)
  giftRedemption: new InMemoryRateLimiter(3, 3600000), // 3 per hour (reduced from 5)
  apiGeneral: new InMemoryRateLimiter(50, 60000), // 50 per minute (reduced from 100)
};

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
 * SECURITY: Implements fail-CLOSED behavior - uses in-memory fallback when Redis unavailable
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = 'apiGeneral'
): Promise<RateLimitResult> {
  // If Redis rate limiting is not configured, use in-memory fallback
  if (!rateLimiters) {
    logger.warn('Redis rate limiting not configured, using in-memory fallback', { type });
    const fallback = fallbackLimiters[type];
    const result = await fallback.checkLimit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  const limiter = rateLimiters[type];
  if (!limiter) {
    logger.warn('Unknown limiter type, using apiGeneral fallback', { type });
    const fallback = fallbackLimiters.apiGeneral;
    const result = await fallback.checkLimit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
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
    // SECURITY: Fail CLOSED - use fallback limiter when Redis errors
    logger.error('Redis rate limit error, falling back to in-memory limiter', error, { type, identifier });
    const fallback = fallbackLimiters[type] || fallbackLimiters.apiGeneral;
    const result = await fallback.checkLimit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
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
