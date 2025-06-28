/**
 * Simple logging utility for consistent logging throughout the application
 */

// Define types for log data
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogData = Record<string, unknown>;

interface LogOptions {
  context?: string;
  data?: LogData;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: LogData;
}

class Logger {
  private isDevelopment = process.env.VERCEL_TARGET_ENV !== 'production';

  /**
   * Log an informational message
   */
  info(message: string, options?: LogOptions): void {
    this.log('info', message, options);
  }

  /**
   * Log a warning message
   */
  warn(message: string, options?: LogOptions): void {
    this.log('warn', message, options);
  }

  /**
   * Log an error message
   */
  error(message: string, options?: LogOptions): void {
    this.log('error', message, options);
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, options?: LogOptions): void {
    if (this.isDevelopment) {
      this.log('debug', message, options);
    }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, options?: LogOptions): void {
    const timestamp = new Date().toISOString();
    const context = options?.context ? `[${options.context}]` : '';
    
    // Create a clean copy of options without known properties
    const logData: LogEntry = {
      timestamp,
      level,
      message: `${context} ${message}`,
    };

    // Extract data from options
    const data = this.extractLogData(options);
    if (data) {
      logData.data = data;
    }
    
    switch (level) {
      case 'info':
        console.log(`ℹ️ ${timestamp} ${context} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`⚠️ ${timestamp} ${context} ${message}`, data || '');
        break;
      case 'error':
        console.error(`🚨 ${timestamp} ${context} ${message}`, data || '');
        break;
      case 'debug':
        console.debug(`🔍 ${timestamp} ${context} ${message}`, data || '');
        break;
      default:
        console.log(`${timestamp} ${context} ${message}`, data || '');
    }

    // Here you could add integrations with external logging services
    // For example, sending logs to Sentry, LogRocket, etc.
  }

  /**
   * Extract log data from options, handling both data property and direct properties
   */
  private extractLogData(options?: LogOptions): LogData | undefined {
    if (!options) return undefined;
    
    // Start with the explicit data property if it exists
    const result: LogData = { ...(options.data || {}) };
    
    // Add all other properties except 'context' and 'data'
    Object.entries(options).forEach(([key, value]) => {
      if (key !== 'context' && key !== 'data') {
        result[key] = value;
      }
    });
    
    return Object.keys(result).length > 0 ? result : undefined;
  }
}

// Export a singleton instance
export const logger = new Logger(); 