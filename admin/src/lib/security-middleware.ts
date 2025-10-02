// Comprehensive security middleware for Next.js API routes
// Combines rate limiting, bot protection, and request validation

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimit, RATE_LIMITS, type RateLimitConfig } from './rate-limit';
import { botProtectionMiddleware, verifyTurnstileToken } from './bot-protection';
import { createClient } from './supabase/server';

export interface SecurityConfig {
  rateLimit?: RateLimitConfig;
  botProtection?: boolean;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  validateInput?: boolean;
  cors?: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
  };
  maxRequestSize?: number; // in bytes
  timeout?: number; // in milliseconds
}

// Default security configurations for different endpoint types
export const SECURITY_CONFIGS = {
  // Public endpoints with minimal protection
  PUBLIC: {
    rateLimit: RATE_LIMITS.PUBLIC,
    botProtection: true,
    requireAuth: false,
    validateInput: true,
    cors: {
      origins: ['https://primeshot.ai', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    }
  },

  // Authenticated endpoints with moderate protection
  AUTHENTICATED: {
    rateLimit: RATE_LIMITS.GENERAL,
    botProtection: true,
    requireAuth: true,
    validateInput: true,
    cors: {
      origins: ['https://primeshot.ai', 'http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    }
  },

  // Upload endpoints with strict protection
  UPLOAD: {
    rateLimit: RATE_LIMITS.UPLOAD,
    botProtection: true,
    requireAuth: true,
    validateInput: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    cors: {
      origins: ['https://primeshot.ai', 'http://localhost:3000'],
      methods: ['POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    }
  },

  // Payment endpoints with maximum protection
  PAYMENT: {
    rateLimit: RATE_LIMITS.PAYMENT,
    botProtection: true,
    requireAuth: true,
    validateInput: true,
    cors: {
      origins: ['https://primeshot.ai'],
      methods: ['POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Stripe-Signature'],
      credentials: true
    }
  },

  // Generation endpoints with expensive operation protection
  GENERATION: {
    rateLimit: RATE_LIMITS.GENERATION,
    botProtection: true,
    requireAuth: true,
    validateInput: true,
    cors: {
      origins: ['https://primeshot.ai', 'http://localhost:3000'],
      methods: ['POST', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    }
  },

  // Webhook endpoints - minimal protection for external services
  WEBHOOK: {
    rateLimit: RATE_LIMITS.WEBHOOK,
    botProtection: false, // Skip bot protection for legitimate webhook services
    requireAuth: false, // Webhooks use signature verification instead
    validateInput: true,
    cors: {
      origins: ['*'], // Allow any origin for webhooks
      methods: ['POST', 'OPTIONS'],
      headers: ['Content-Type', 'Stripe-Signature', 'User-Agent'],
      credentials: false
    }
  },

  // Admin endpoints with maximum protection
  ADMIN: {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 requests per minute
      keyGenerator: (req: Request) => `admin:${req.headers.get('x-user-id') || 'unknown'}`
    },
    botProtection: true,
    requireAuth: true,
    requireAdmin: true,
    validateInput: true,
    cors: {
      origins: ['https://primeshot.ai'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization'],
      credentials: true
    }
  }
};

// Request validation utilities
export function validateRequestBody(body: any, schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return { valid: false, errors };
  }

  // Basic validation - extend with proper schema validation library like Joi or Zod
  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];

    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`Field ${key} must be of type ${rules.type}, got ${typeof value}`);
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`Field ${key} must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`Field ${key} must be at most ${rules.maxLength} characters long`);
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(`Field ${key} format is invalid`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Field ${key} must be one of: ${rules.enum.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Authentication middleware
export async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: any;
  admin?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        error: 'Authentication required'
      };
    }

    // Check if admin is required
    const { data: profile } = await supabase
      .from('users')
      .select('admin')
      .eq('id', user.id)
      .single();

    return {
      authenticated: true,
      user,
      admin: profile?.admin || false
    };
  } catch (error) {
    return {
      authenticated: false,
      error: 'Authentication check failed'
    };
  }
}

// CORS middleware
export function corsMiddleware(config: SecurityConfig['cors']) {
  return (request: NextRequest) => {
    const origin = request.headers.get('origin') || '';
    const origins = config?.origins || ['https://primeshot.ai', 'http://localhost:3000'];

    // Check if origin is allowed
    const isAllowedOrigin = origins.includes('*') ||
      origins.includes(origin) ||
      origins.some(allowed => origin.endsWith(allowed));

    const headers = new Headers();

    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (origins.includes('*')) {
      headers.set('Access-Control-Allow-Origin', '*');
    }

    headers.set('Access-Control-Allow-Methods', (config?.methods || ['GET', 'POST', 'OPTIONS']).join(', '));
    headers.set('Access-Control-Allow-Headers', (config?.headers || ['Content-Type', 'Authorization']).join(', '));

    if (config?.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return headers;
  };
}

// Main security middleware factory
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  return async (request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>): Promise<NextResponse> => {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      const corsHeaders = corsMiddleware(config.cors)(request);
      return new NextResponse('ok', { status: 200, headers: corsHeaders });
    }

    // Check request size limits
    if (config.maxRequestSize) {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > config.maxRequestSize) {
        return NextResponse.json(
          { error: 'Request too large', maxSize: config.maxRequestSize },
          { status: 413 }
        );
      }
    }

    // Apply rate limiting if configured
    if (config.rateLimit) {
      try {
        const rateLimitMiddleware = createRateLimit(config.rateLimit);
        const rateLimitResponse = await rateLimitMiddleware(request, async () => handler(request));

        if (rateLimitResponse.status === 429) {
          return rateLimitResponse;
        }

        // Add rate limit headers to response
        const headers = new Headers(rateLimitResponse.headers);
        if (rateLimitResponse.headers.get('x-ratelimit-limit')) {
          headers.set('X-RateLimit-Limit', rateLimitResponse.headers.get('x-ratelimit-limit') || '');
          headers.set('X-RateLimit-Remaining', rateLimitResponse.headers.get('x-ratelimit-remaining') || '');
          headers.set('X-RateLimit-Reset', rateLimitResponse.headers.get('x-ratelimit-reset') || '');
        }

        return new NextResponse(rateLimitResponse.body, {
          status: rateLimitResponse.status,
          headers
        });
      } catch (error) {
        console.error('Rate limiting error:', error);
        // Continue without rate limiting on error
      }
    }

    // Apply authentication if required
    if (config.requireAuth || config.requireAdmin) {
      const authResult = await authenticateRequest(request);

      if (!authResult.authenticated) {
        return NextResponse.json(
          { error: authResult.error || 'Authentication required' },
          { status: 401 }
        );
      }

      if (config.requireAdmin && !authResult.admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Add user info to request headers for handler use
      const headers = new Headers(request.headers);
      headers.set('x-user-id', authResult.user!.id);
      headers.set('x-user-admin', authResult.admin ? 'true' : 'false');
      request = new NextRequest(request.url, {
        method: request.method,
        headers,
        body: request.body
      });
    }

    // Apply bot protection if enabled
    if (config.botProtection) {
      try {
        // For form data, we need to parse it for honeypot detection
        let formData: FormData | undefined;
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
          try {
            formData = await request.formData();
          } catch (error) {
            console.warn('Failed to parse form data for bot detection:', error);
          }
        }

        const botResult = await botProtectionMiddleware(request, formData);

        if (!botResult.allowed) {
          if (botResult.challenge === 'captcha_required') {
            return NextResponse.json(
              {
                error: botResult.error,
                challenge: 'captcha_required',
                reasons: [] // Don't expose bot detection reasons to client
              },
              { status: 403 }
            );
          }

          return NextResponse.json(
            { error: botResult.error || 'Access denied' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error('Bot protection error:', error);
        // Continue without bot protection on error
      }
    }

    // Validate input if configured
    if (config.validateInput && request.method !== 'GET') {
      try {
        const body = await request.json().catch(() => ({}));

        // Basic validation - extend with specific schemas per endpoint
        if (Object.keys(body).length > 0) {
          // Check for suspicious patterns in request body
          const bodyStr = JSON.stringify(body).toLowerCase();
          const suspiciousPatterns = [
            '<script',
            'javascript:',
            'eval(',
            'alert(',
            'document.cookie',
            'window.location'
          ];

          for (const pattern of suspiciousPatterns) {
            if (bodyStr.includes(pattern)) {
              return NextResponse.json(
                { error: 'Invalid request content' },
                { status: 400 }
              );
            }
          }
        }
      } catch (error) {
        // Invalid JSON is handled as validation error
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    }

    // Execute the actual handler
    try {
      const response = await handler(request);

      // Add security headers to response
      const headers = new Headers(response.headers);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-XSS-Protection', '1; mode=block');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add CORS headers if configured
      if (config.cors) {
        const corsHeaders = corsMiddleware(config.cors)(request);
        corsHeaders.forEach((value, key) => {
          headers.set(key, value);
        });
      }

      return new NextResponse(response.body, {
        status: response.status,
        headers
      });
    } catch (error) {
      console.error('Handler execution error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper function to create secured API route handlers
export function createSecuredHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = SECURITY_CONFIGS.PUBLIC
) {
  const securityMiddleware = createSecurityMiddleware(config);

  return async (request: NextRequest): Promise<NextResponse> => {
    return await securityMiddleware(request, handler);
  };
}

// Specific security configurations for common endpoint patterns
export const SECURITY_PRESETS = {
  // Public endpoints with minimal protection
  PUBLIC: {
    ...SECURITY_CONFIGS.PUBLIC
  },

  // Image upload with bot protection and strict rate limiting
  IMAGE_UPLOAD: {
    ...SECURITY_CONFIGS.UPLOAD,
    botProtection: true,
    maxRequestSize: 50 * 1024 * 1024, // 50MB for images
    validateInput: true
  },

  // AI generation with expensive operation protection
  AI_GENERATION: {
    ...SECURITY_CONFIGS.GENERATION,
    rateLimit: {
      windowMs: 60 * 1000,
      maxRequests: 3, // Very strict for expensive operations
      keyGenerator: (req: Request) => `generation:${req.headers.get('x-user-id') || 'anonymous'}`
    }
  },

  // Credit/payment operations with maximum security
  PAYMENT_OPERATION: {
    ...SECURITY_CONFIGS.PAYMENT,
    botProtection: true,
    validateInput: true
  },

  // Admin operations with maximum restrictions
  ADMIN: {
    ...SECURITY_CONFIGS.ADMIN,
    rateLimit: {
      windowMs: 60 * 1000,
      maxRequests: 5, // Very strict for admin operations
      keyGenerator: (req: Request) => `admin:${req.headers.get('x-user-id') || 'unknown'}`
    }
  }
};
