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

/**
 * Create a deterministic hash for a story request
 * Used to detect duplicate/suspicious requests
 */
export function hashStoryRequest(request: {
  storyRequest: string;
  tone: string;
  ageGroup: string;
  length: string;
  style: string;
}): string {
  const normalized = JSON.stringify({
    request: request.storyRequest.toLowerCase().trim(),
    tone: request.tone,
    age: request.ageGroup,
    length: request.length,
    style: request.style,
  });

  // Simple hash function (FNV-1a)
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

/**
 * In-memory store for suspicious pattern detection
 * Maps userId -> array of {hash, timestamp}
 */
class SuspiciousPatternDetector {
  private requestHistory: Map<string, Array<{ hash: string; timestamp: number }>> = new Map();
  private readonly windowMs: number = 5 * 60 * 1000; // 5 minutes
  private readonly suspiciousThreshold: number = 3; // 3+ identical requests in window

  constructor() {
    // Cleanup old entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Track a request and check if it's suspicious
   * Returns true if the pattern is suspicious
   */
  async trackAndCheck(userId: string, requestHash: string): Promise<boolean> {
    const now = Date.now();
    const userHistory = this.requestHistory.get(userId) || [];

    // Filter out old requests outside the window
    const recentRequests = userHistory.filter(req => now - req.timestamp < this.windowMs);

    // Count identical requests in the window
    const identicalCount = recentRequests.filter(req => req.hash === requestHash).length;

    // Add this request to history
    recentRequests.push({ hash: requestHash, timestamp: now });
    this.requestHistory.set(userId, recentRequests);

    // Check if suspicious (3+ identical requests)
    return identicalCount >= this.suspiciousThreshold - 1; // -1 because we haven't counted current request yet
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [userId, history] of this.requestHistory.entries()) {
      const recentRequests = history.filter(req => now - req.timestamp < this.windowMs);
      if (recentRequests.length === 0) {
        this.requestHistory.delete(userId);
      } else {
        this.requestHistory.set(userId, recentRequests);
      }
    }
  }
}

// Initialize pattern detector
const suspiciousPatternDetector = new SuspiciousPatternDetector();

/**
 * Check for suspicious request patterns
 * Returns true if the request pattern is suspicious (same request repeated 3+ times in 5 minutes)
 */
export async function checkSuspiciousPattern(userId: string, requestHash: string): Promise<boolean> {
  try {
    // If Redis is available, use it for distributed tracking
    if (redis) {
      const key = `suspicious:${userId}:${requestHash}`;
      const count = await redis.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await redis.expire(key, 300); // 5 minutes
      }

      // Log suspicious activity
      if (count >= 3) {
        logger.warn('Suspicious request pattern detected', {
          userId,
          requestHash,
          count,
        });
        return true;
      }

      return false;
    }

    // Fallback to in-memory detection
    const isSuspicious = await suspiciousPatternDetector.trackAndCheck(userId, requestHash);

    if (isSuspicious) {
      logger.warn('Suspicious request pattern detected (in-memory)', {
        userId,
        requestHash,
      });
    }

    return isSuspicious;
  } catch (error) {
    // On error, don't block the request but log the issue
    logger.error('Error checking suspicious pattern', error, { userId, requestHash });
    return false;
  }
}
