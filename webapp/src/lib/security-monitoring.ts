// Security monitoring and alerting system
// Tracks security events and sends alerts for suspicious activities

export interface SecurityEvent {
  type: 'rate_limit_exceeded' | 'bot_detected' | 'suspicious_request' | 'auth_failure' | 'unauthorized_access' | 'malicious_payload' | 'unusual_traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AlertConfig {
  slack?: {
    webhookUrl: string;
    channel?: string;
  };
  webhook?: {
    url: string;
    secret?: string;
  };
  email?: {
    smtp: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
    from: string;
    to: string[];
  };
}

// Default alert configuration
const ALERT_CONFIG: AlertConfig = {
  slack: {
    webhookUrl: process.env.SECURITY_SLACK_WEBHOOK || '',
    channel: '#security-alerts'
  },
  webhook: {
    url: process.env.SECURITY_WEBHOOK_URL || ''
  }
};

// Security event store (in-memory for demo - use proper logging service in production)
class SecurityEventStore {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  add(event: SecurityEvent): void {
    this.events.unshift(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Trigger alerts for high-severity events
    if (event.severity === 'high' || event.severity === 'critical' || event.type === 'rate_limit_exceeded') {
      this.triggerAlert(event);
    }
  }

  getRecent(limit: number = 100): SecurityEvent[] {
    return this.events.slice(0, limit);
  }

  getByType(type: SecurityEvent['type'], limit: number = 50): SecurityEvent[] {
    return this.events.filter(event => event.type === type).slice(0, limit);
  }

  getByIP(ip: string, limit: number = 50): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip).slice(0, limit);
  }

  getByUserId(userId: string, limit: number = 50): SecurityEvent[] {
    return this.events.filter(event => event.userId === userId).slice(0, limit);
  }

  private async triggerAlert(event: SecurityEvent): Promise<void> {
    try {
      // Send Slack alert
      if (ALERT_CONFIG.slack?.webhookUrl) {
        await sendSlackAlert(event);
      }

      // Send webhook alert
      if (ALERT_CONFIG.webhook?.url) {
        await sendWebhookAlert(event);
      }

      // Log to console for debugging
      console.warn(`[SECURITY ALERT] ${event.severity.toUpperCase()}: ${event.type}`, {
        ip: event.ip,
        endpoint: event.endpoint,
        message: event.message,
        metadata: event.metadata
      });

    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
}

// Global security event store instance
export const securityEventStore = new SecurityEventStore();

// Alert formatting functions
async function sendSlackAlert(event: SecurityEvent): Promise<void> {
  if (!ALERT_CONFIG.slack?.webhookUrl) return;

  const severityEmoji = {
    low: '⚠️',
    medium: '🚨',
    high: '🔴',
    critical: '🚨🚨'
  };

  const typeEmoji = {
    rate_limit_exceeded: '⏱️',
    bot_detected: '🤖',
    suspicious_request: '🔍',
    auth_failure: '🔒',
    unauthorized_access: '🚫',
    malicious_payload: '🛡️',
    unusual_traffic: '📈'
  };

  const payload = {
    channel: ALERT_CONFIG.slack.channel,
    username: 'Security Monitor',
    icon_emoji: ':shield:',
    attachments: [{
      color: event.severity === 'critical' ? 'danger' : event.severity === 'high' ? 'warning' : 'good',
      title: `${severityEmoji[event.severity]} Security Alert: ${event.type.replace(/_/g, ' ').toUpperCase()}`,
      text: event.message,
      fields: [
        {
          title: 'IP Address',
          value: event.ip,
          short: true
        },
        {
          title: 'Endpoint',
          value: `${event.method} ${event.endpoint}`,
          short: true
        },
        {
          title: 'User Agent',
          value: event.userAgent.substring(0, 100) + (event.userAgent.length > 100 ? '...' : ''),
          short: true
        },
        {
          title: 'User ID',
          value: event.userId || 'Anonymous',
          short: true
        },
        {
          title: 'Timestamp',
          value: new Date(event.timestamp).toLocaleString(),
          short: true
        }
      ],
      footer: 'PrimeShot Security Monitor',
      ts: Math.floor(new Date(event.timestamp).getTime() / 1000)
    }]
  };

  const response = await fetch(ALERT_CONFIG.slack.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Slack alert failed: ${response.statusText}`);
  }
}

async function sendWebhookAlert(event: SecurityEvent): Promise<void> {
  if (!ALERT_CONFIG.webhook?.url) return;

  const payload = {
    event,
    alert: {
      id: crypto.randomUUID(),
      type: event.type,
      severity: event.severity,
      timestamp: new Date().toISOString(),
      source: 'primeshot-security-monitor'
    }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'PrimeShot-Security-Monitor/1.0'
  };

  if (ALERT_CONFIG.webhook.secret) {
    headers['X-Security-Secret'] = ALERT_CONFIG.webhook.secret;
  }

  const response = await fetch(ALERT_CONFIG.webhook.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook alert failed: ${response.statusText}`);
  }
}

// Main security monitoring function
export function logSecurityEvent(
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  message: string,
  context: {
    request?: Request;
    userId?: string;
    metadata?: Record<string, any>;
    statusCode?: number;
  } = {}
): void {
  const request = context.request;
  const ip = request ? getClientIP(request) : 'unknown';
  const userAgent = request ? (request.headers.get('user-agent') || '') : '';
  const endpoint = request ? new URL(request.url).pathname : 'unknown';
  const method = request ? request.method : 'UNKNOWN';

  const event: SecurityEvent = {
    type,
    severity,
    userId: context.userId,
    ip,
    userAgent,
    endpoint,
    method,
    statusCode: context.statusCode,
    message,
    metadata: context.metadata,
    timestamp: new Date().toISOString()
  };

  securityEventStore.add(event);
}

// Helper function to get client IP
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  return forwarded?.split(',')[0] || realIP || clientIP || 'unknown';
}

// Security monitoring middleware for API routes
export function createSecurityMonitoringMiddleware() {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now();
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const endpoint = new URL(request.url).pathname;
    const method = request.method;

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      // Log slow requests as potential attacks
      if (duration > 5000) { // 5 seconds
        logSecurityEvent(
          'suspicious_request',
          'medium',
          `Unusually slow request detected (${duration}ms)`,
          {
            request,
            metadata: { duration, statusCode: response.status }
          }
        );
      }

      // Log 4xx/5xx responses
      if (response.status >= 400) {
        let severity: SecurityEvent['severity'] = 'low';
        let type: SecurityEvent['type'] = 'suspicious_request';

        if (response.status === 401 || response.status === 403) {
          type = 'auth_failure';
          severity = 'medium';
        } else if (response.status === 429) {
          type = 'rate_limit_exceeded';
          severity = 'medium';
        } else if (response.status >= 500) {
          type = 'suspicious_request';
          severity = 'high';
        }

        logSecurityEvent(
          type,
          severity,
          `HTTP ${response.status} response`,
          {
            request,
            statusCode: response.status,
            metadata: { duration }
          }
        );
      }

      // Add security monitoring headers
      response.headers.set('X-Security-Monitor', 'enabled');
      response.headers.set('X-Request-ID', crypto.randomUUID());

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Log errors as potential attacks
      logSecurityEvent(
        'suspicious_request',
        'high',
        `Request handler error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          request,
          metadata: { duration, error: error instanceof Error ? error.stack : String(error) }
        }
      );

      throw error;
    }
  };
}

// Export monitoring utilities

// Rate limiting violation reporter
export function reportRateLimitViolation(
  key: string,
  limit: number,
  currentCount: number,
  request: Request
): void {
  logSecurityEvent(
    'rate_limit_exceeded',
    'medium',
    `Rate limit violation: ${currentCount}/${limit} requests`,
    {
      request,
      metadata: { key, limit, currentCount }
    }
  );
}

// Bot detection reporter
export function reportBotDetection(
  request: Request,
  reasons: string[],
  score: number,
  formData?: FormData
): void {
  logSecurityEvent(
    'bot_detected',
    score >= 80 ? 'high' : 'medium',
    `Bot detected with score ${score}/100: ${reasons.join(', ')}`,
    {
      request,
      metadata: { reasons, score, hasFormData: !!formData }
    }
  );
}

// Suspicious payload reporter
export function reportSuspiciousPayload(
  request: Request,
  suspiciousPatterns: string[],
  payload: string
): void {
  logSecurityEvent(
    'malicious_payload',
    'high',
    `Suspicious patterns detected in request payload`,
    {
      request,
      metadata: {
        suspiciousPatterns,
        payloadPreview: payload.substring(0, 200) + (payload.length > 200 ? '...' : '')
      }
    }
  );
}
