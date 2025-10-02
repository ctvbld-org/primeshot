// Bot protection utilities using Cloudflare Turnstile
// Provides CAPTCHA verification for critical endpoints

export interface TurnstileConfig {
  siteKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export interface BotProtectionConfig {
  turnstile?: TurnstileConfig;
  honeypot?: boolean; // Enable honeypot field detection
  userAgent?: string[]; // Block suspicious user agents
  rateLimit?: {
    requests: number;
    window: number;
  };
}

// Default bot protection configuration
export const BOT_PROTECTION_CONFIG: BotProtectionConfig = {
  turnstile: {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    secretKey: process.env.TURNSTILE_SECRET_KEY || '',
    enabled: process.env.NODE_ENV === 'production' && !!process.env.TURNSTILE_SECRET_KEY
  },
  honeypot: true,
  userAgent: [
    'bot',
    'spider',
    'crawler',
    'scraper',
    'wget',
    'curl',
    'python-requests',
    'go-http-client',
    'java/',
    '.net',
    'scrapy',
    'beautifulsoup',
    'selenium',
    'phantomjs',
    'webdriver',
    'puppeteer'
  ],
  rateLimit: {
    requests: 100,
    window: 60000 // 1 minute
  }
};

// Turnstile verification function
export async function verifyTurnstileToken(
  token: string,
  userIP?: string
): Promise<TurnstileResponse> {
  if (!BOT_PROTECTION_CONFIG.turnstile?.enabled) {
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append('secret', BOT_PROTECTION_CONFIG.turnstile.secretKey);
    formData.append('response', token);

    if (userIP) {
      formData.append('remoteip', userIP);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Turnstile verification failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Turnstile verification error:', error);
    // Fail open for production reliability
    return { success: true };
  }
}

// Honeypot field detection
export function isHoneypotTriggered(formData: FormData): boolean {
  if (!BOT_PROTECTION_CONFIG.honeypot) {
    return false;
  }

  // Check common honeypot field names
  const honeypotFields = [
    'website',
    'url',
    'email_confirm',
    'phone',
    'company',
    'address',
    'name_confirm',
    'verify',
    'captcha',
    'human'
  ];

  for (const field of honeypotFields) {
    const value = formData.get(field);
    if (value && value.toString().trim() !== '') {
      return true; // Honeypot field was filled
    }
  }

  return false;
}

// User agent analysis
export function isSuspiciousUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;

  const lowerUA = userAgent.toLowerCase();

  // Check for suspicious patterns
  for (const pattern of BOT_PROTECTION_CONFIG.userAgent || []) {
    if (lowerUA.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check for missing or generic user agents
  if (lowerUA.length < 10 || lowerUA === 'unknown') {
    return true;
  }

  // Check for bot-like patterns
  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i,
    /wget/i,
    /curl/i,
    /python/i,
    /java/i,
    /selenium/i,
    /phantom/i,
    /webdriver/i,
    /puppeteer/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

// IP-based bot detection (simple heuristics)
export function isSuspiciousIP(ip: string): boolean {
  // Local/private IPs are generally safe
  if (ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.') ||
      ip === '127.0.0.1' ||
      ip === '::1') {
    return false;
  }

  // Check for common VPN/proxy patterns (basic check)
  // Note: This is not comprehensive - use a proper IP intelligence service in production
  const suspiciousRanges = [
    '104.16.0.0/12', // Cloudflare (legitimate but could be proxies)
    '173.245.48.0/20', // Cloudflare
  ];

  // This is a very basic check - in production, use MaxMind or similar
  return false;
}

// Comprehensive bot detection function
export async function detectBot(
  request: Request,
  formData?: FormData
): Promise<{
  isBot: boolean;
  reasons: string[];
  score: number; // 0-100, higher = more likely bot
}> {
  const reasons: string[] = [];
  let score = 0;

  // Check user agent
  const userAgent = request.headers.get('user-agent') || '';
  if (isSuspiciousUserAgent(userAgent)) {
    reasons.push('suspicious_user_agent');
    score += 40;
  }

  // Check IP (basic)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  const ip = forwarded?.split(',')[0] || realIP || clientIP || '';

  if (isSuspiciousIP(ip)) {
    reasons.push('suspicious_ip');
    score += 20;
  }

  // Check honeypot fields
  if (formData && isHoneypotTriggered(formData)) {
    reasons.push('honeypot_triggered');
    score += 60;
  }

  // Check for missing required headers
  const accept = request.headers.get('accept');
  const acceptLanguage = request.headers.get('accept-language');

  if (!accept || !acceptLanguage) {
    reasons.push('missing_headers');
    score += 15;
  }

  // Check for automation indicators
  const secChUa = request.headers.get('sec-ch-ua');
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile');
  const secChUaPlatform = request.headers.get('sec-ch-ua-platform');

  if (!secChUa || !secChUaMobile || !secChUaPlatform) {
    reasons.push('missing_chrome_headers');
    score += 25;
  }

  // Check for rapid requests (basic rate limiting)
  // This would need to be integrated with the rate limiting system
  const xRateLimitRemaining = request.headers.get('x-ratelimit-remaining');
  if (xRateLimitRemaining && parseInt(xRateLimitRemaining) < 10) {
    reasons.push('rate_limit_near_exhaustion');
    score += 30;
  }

  return {
    isBot: score >= 50, // Threshold for bot detection
    reasons,
    score: Math.min(score, 100)
  };
}

// Generate Turnstile widget HTML
export function generateTurnstileWidget(action: string = 'generic'): string {
  if (!BOT_PROTECTION_CONFIG.turnstile?.enabled) {
    return '';
  }

  return `
    <div class="cf-turnstile" data-sitekey="${BOT_PROTECTION_CONFIG.turnstile.siteKey}" data-action="${action}"></div>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  `;
}

// Middleware function for bot protection
export async function botProtectionMiddleware(
  request: Request,
  formData?: FormData
): Promise<{
  allowed: boolean;
  challenge?: string;
  error?: string;
}> {
  // Skip bot protection in development or if disabled
  if (process.env.NODE_ENV === 'development' || !BOT_PROTECTION_CONFIG.turnstile?.enabled) {
    return { allowed: true };
  }

  const botDetection = await detectBot(request, formData);

  if (botDetection.isBot) {
    // For high-confidence bots, block immediately
    if (botDetection.score >= 80) {
      return {
        allowed: false,
        error: 'Bot detected. Access denied.'
      };
    }

    // For medium-confidence, require CAPTCHA challenge
    if (botDetection.score >= 50) {
      return {
        allowed: false,
        challenge: 'captcha_required',
        error: 'Please complete the CAPTCHA challenge to continue.'
      };
    }
  }

  return { allowed: true };
}

// Export Turnstile configuration for client-side use
export function getTurnstileConfig() {
  return {
    siteKey: BOT_PROTECTION_CONFIG.turnstile?.siteKey || '',
    enabled: BOT_PROTECTION_CONFIG.turnstile?.enabled || false
  };
}
