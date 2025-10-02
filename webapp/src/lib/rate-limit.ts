// Advanced rate limiting system for Next.js API routes
// Implements multiple rate limiting strategies for different endpoints

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (req: Request) => string; // Custom key generation
  handler?: (req: Request, res: Response, next: () => void) => void; // Custom handler
}

export interface RateLimitStore {
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
  resetKey(key: string): Promise<void>;
  resetAll(): Promise<void>;
}

// In-memory store for development (replace with Redis in production)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return 1;
    }

    existing.count++;
    return existing.count;
  }

  async decrement(key: string): Promise<number> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
      return existing.count;
    }
    return 0;
  }

  async resetKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }
}

// IP-based rate limiting key generator
export function ipKeyGenerator(req: Request): string {
  // Get IP from various headers (handles proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');

  const ip = forwarded?.split(',')[0] ||
             realIP ||
             clientIP ||
             'unknown';

  return `ip:${ip}`;
}

// User-based rate limiting key generator (requires auth)
export function userKeyGenerator(req: Request): string {
  const userId = req.headers.get('x-user-id') ||
                 req.headers.get('x-auth-user-id') ||
                 'anonymous';
  return `user:${userId}`;
}

// Combined key generator (IP + User)
export function combinedKeyGenerator(req: Request): string {
  const ipKey = ipKeyGenerator(req);
  const userKey = userKeyGenerator(req);
  return `${ipKey}:${userKey}`;
}

// Rate limiting middleware factory
export function createRateLimit(config: RateLimitConfig) {
  const store = new MemoryRateLimitStore();

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const key = config.keyGenerator ? config.keyGenerator(req) : ipKeyGenerator(req);
    const currentCount = await store.increment(key);

    // Check if rate limit exceeded
    if (currentCount > config.maxRequests) {
      // Create custom response if handler provided
      if (config.handler) {
        // For handler, we need to create a response-like object
        const response = new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(config.windowMs / 1000),
            limit: config.maxRequests,
            remaining: Math.max(0, config.maxRequests - currentCount)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': Math.max(0, config.maxRequests - currentCount).toString(),
              'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
              'Retry-After': Math.ceil(config.windowMs / 1000).toString()
            }
          }
        );
        return response;
      }

      // Default rate limit exceeded response
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(config.windowMs / 1000)} seconds.`,
          retryAfter: Math.ceil(config.windowMs / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
          }
        }
      );
    }

    // Execute the request
    const response = await next();

    // Decrement on successful requests if configured
    if (config.skipSuccessfulRequests && response.ok) {
      await store.decrement(key);
    }

    // Add rate limit headers to successful responses
    const remaining = Math.max(0, config.maxRequests - currentCount);
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());

    return response;
  };
}

// Predefined rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 attempts per 5 minutes
    keyGenerator: ipKeyGenerator
  },

  // Upload endpoints - moderate limits for large operations
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 uploads per minute
    keyGenerator: userKeyGenerator
  },

  // Image generation - expensive operations
  GENERATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 generations per minute (increased for subscribed users)
    keyGenerator: userKeyGenerator
  },

  // Credit/payment operations - very strict
  PAYMENT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 operations per 5 minutes
    keyGenerator: userKeyGenerator
  },

  // General API endpoints - moderate limits
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: ipKeyGenerator
  },

  // Public endpoints - stricter for anonymous users
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    keyGenerator: ipKeyGenerator
  },

  // Webhook endpoints - very permissive for legitimate services
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (req: Request) => {
      // Use a more specific key for webhooks
      const userAgent = req.headers.get('user-agent') || 'unknown';
      return `webhook:${userAgent}`;
    }
  }
};

// Sliding window rate limiter for more sophisticated control
export class SlidingWindowRateLimiter {
  private store = new Map<string, { timestamps: number[]; windowMs: number; maxRequests: number }>();

  constructor(private defaultWindowMs: number, private defaultMaxRequests: number) {}

  async check(key: string, windowMs?: number, maxRequests?: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const window = windowMs || this.defaultWindowMs;
    const max = maxRequests || this.defaultMaxRequests;
    const now = Date.now();

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [], windowMs: window, maxRequests: max };
      this.store.set(key, entry);
    }

    // Clean old timestamps outside the window
    entry.timestamps = entry.timestamps.filter(timestamp => now - timestamp < window);

    const remaining = Math.max(0, max - entry.timestamps.length);

    if (entry.timestamps.length >= max) {
      const oldestTimestamp = Math.min(...entry.timestamps);
      const resetTime = oldestTimestamp + window;
      return { allowed: false, remaining: 0, resetTime };
    }

    entry.timestamps.push(now);
    return { allowed: true, remaining, resetTime: now + window };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Export singleton instances for common use cases
export const authRateLimiter = new SlidingWindowRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5 // 5 attempts
);

export const uploadRateLimiter = new SlidingWindowRateLimiter(
  60 * 1000, // 1 minute
  3 // 3 uploads
);

export const generationRateLimiter = new SlidingWindowRateLimiter(
  60 * 1000, // 1 minute
  30 // 30 generations (increased for subscribed users)
);

export const paymentRateLimiter = new SlidingWindowRateLimiter(
  5 * 60 * 1000, // 5 minutes
  3 // 3 operations
);
