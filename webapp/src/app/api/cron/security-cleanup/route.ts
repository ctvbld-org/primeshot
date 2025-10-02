import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Security cleanup cron job
// Runs daily to clean up old rate limiting data, failed attempts, etc.
export async function GET() {
  try {
    const supabase = createServiceClient();

    // Clean up old rate limiting data (older than 24 hours)
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Clean up failed authentication attempts
    const { error: authCleanupError } = await supabase
      .from('auth_attempts')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (authCleanupError) {
      console.error('Error cleaning up auth attempts:', authCleanupError);
    }

    // Clean up old webhook processing logs
    const { error: webhookCleanupError } = await supabase
      .from('webhook_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (webhookCleanupError) {
      console.error('Error cleaning up webhook logs:', webhookCleanupError);
    }

    // Clean up old bot detection logs
    const { error: botCleanupError } = await supabase
      .from('bot_detection_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (botCleanupError) {
      console.error('Error cleaning up bot detection logs:', botCleanupError);
    }

    // Clean up old rate limiting violations (if stored in DB)
    const { error: rateLimitCleanupError } = await supabase
      .from('rate_limit_violations')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (rateLimitCleanupError) {
      console.error('Error cleaning up rate limit violations:', rateLimitCleanupError);
    }

    return NextResponse.json({
      success: true,
      message: 'Security cleanup completed',
      timestamp: new Date().toISOString(),
      cleaned: {
        auth_attempts: !authCleanupError,
        webhook_logs: !webhookCleanupError,
        bot_detection_logs: !botCleanupError,
        rate_limit_violations: !rateLimitCleanupError
      }
    });

  } catch (error) {
    console.error('Security cleanup error:', error);
    return NextResponse.json(
      { error: 'Security cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
