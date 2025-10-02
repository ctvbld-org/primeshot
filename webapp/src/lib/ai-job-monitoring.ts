import { logSecurityEvent } from './security-monitoring'

export interface AIJobFailure {
  jobId: string
  jobType: 'training' | 'inference'
  userId: string
  characterId?: string
  status: string
  errorMessage?: string
  retryCount?: number
  creditsSpent?: number
  timestamp: string
  metadata?: Record<string, any>
}

export interface AIJobAlert {
  type: 'job_failed' | 'job_timeout' | 'job_retry_exhausted' | 'multiple_failures'
  severity: 'medium' | 'high' | 'critical'
  jobType: 'training' | 'inference'
  count?: number
  timeWindow?: string
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  // Multiple failures in short time window
  MULTIPLE_FAILURES: {
    COUNT: 3,
    WINDOW_MINUTES: 10
  },
  // Retry exhaustion threshold
  MAX_RETRIES: 5,
  // High-value job failure threshold (in credits)
  HIGH_VALUE_JOB: 50
}

// In-memory failure tracking (in production, use Redis or database)
class AIJobFailureTracker {
  private failures: AIJobFailure[] = []
  private maxFailures = 1000

  addFailure(failure: AIJobFailure): void {
    this.failures.unshift(failure)
    
    // Keep only recent failures
    if (this.failures.length > this.maxFailures) {
      this.failures = this.failures.slice(0, this.maxFailures)
    }

    // Trigger appropriate alerts
    this.analyzeAndAlert(failure)
  }

  private analyzeAndAlert(failure: AIJobFailure): void {
    // 1. Single job failure alert
    this.triggerJobFailureAlert(failure)

    // 2. Check for multiple failures pattern
    this.checkMultipleFailuresPattern(failure)

    // 3. Check for retry exhaustion
    this.checkRetryExhaustion(failure)
  }

  private triggerJobFailureAlert(failure: AIJobFailure): void {
    let severity: AIJobAlert['severity'] = 'medium'
    let alertType: AIJobAlert['type'] = 'job_failed'

    // Determine severity based on job characteristics
    if (failure.jobType === 'training') {
      severity = 'high' // Training failures are more critical
    }

    if (failure.creditsSpent && failure.creditsSpent >= ALERT_THRESHOLDS.HIGH_VALUE_JOB) {
      severity = 'critical' // High-value job failures
    }

    if (failure.retryCount && failure.retryCount >= ALERT_THRESHOLDS.MAX_RETRIES) {
      alertType = 'job_retry_exhausted'
      severity = 'critical'
    }

    // Send alert
    this.sendAIJobAlert({
      type: alertType,
      severity,
      jobType: failure.jobType,
      failure
    })
  }

  private checkMultipleFailuresPattern(failure: AIJobFailure): void {
    const windowStart = new Date(Date.now() - ALERT_THRESHOLDS.MULTIPLE_FAILURES.WINDOW_MINUTES * 60 * 1000)
    
    const recentFailures = this.failures.filter(f => 
      new Date(f.timestamp) >= windowStart && 
      f.jobType === failure.jobType
    )

    if (recentFailures.length >= ALERT_THRESHOLDS.MULTIPLE_FAILURES.COUNT) {
      this.sendAIJobAlert({
        type: 'multiple_failures',
        severity: 'critical',
        jobType: failure.jobType,
        count: recentFailures.length,
        timeWindow: `${ALERT_THRESHOLDS.MULTIPLE_FAILURES.WINDOW_MINUTES} minutes`,
        failure
      })
    }
  }

  private checkRetryExhaustion(failure: AIJobFailure): void {
    if (failure.retryCount && failure.retryCount >= ALERT_THRESHOLDS.MAX_RETRIES) {
      this.sendAIJobAlert({
        type: 'job_retry_exhausted',
        severity: 'critical',
        jobType: failure.jobType,
        failure
      })
    }
  }

  private async sendAIJobAlert(alert: AIJobAlert & { failure?: AIJobFailure }): Promise<void> {
    const { failure } = alert
    if (!failure) return

    // Use existing security monitoring system for consistency
    logSecurityEvent(
      'unusual_traffic', // Repurpose this type for AI job failures
      alert.severity,
      this.formatAlertMessage(alert),
      {
        metadata: {
          alertType: 'ai_job_failure',
          jobType: alert.jobType,
          jobId: failure.jobId,
          userId: failure.userId,
          characterId: failure.characterId,
          errorMessage: failure.errorMessage,
          retryCount: failure.retryCount,
          creditsSpent: failure.creditsSpent,
          count: alert.count,
          timeWindow: alert.timeWindow,
          timestamp: failure.timestamp
        }
      }
    )

    // Also send direct Slack alert with more detailed formatting
    await this.sendDirectSlackAlert(alert)
  }

  private formatAlertMessage(alert: AIJobAlert & { failure?: AIJobFailure }): string {
    const { type, jobType, failure, count, timeWindow } = alert

    switch (type) {
      case 'job_failed':
        return `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} job failed: ${failure?.errorMessage || 'Unknown error'}`
      
      case 'job_timeout':
        return `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} job timed out after extended runtime`
      
      case 'job_retry_exhausted':
        return `${jobType.charAt(0).toUpperCase() + jobType.slice(1)} job failed after ${failure?.retryCount} retry attempts`
      
      case 'multiple_failures':
        return `Multiple ${jobType} job failures detected: ${count} failures in ${timeWindow}`
      
      default:
        return `AI job monitoring alert: ${type}`
    }
  }

  private async sendDirectSlackAlert(alert: AIJobAlert & { failure?: AIJobFailure }): Promise<void> {
    // Use AI_MONITORING_SLACK_WEBHOOK if available, otherwise fall back to SECURITY_SLACK_WEBHOOK
    const webhookUrl = process.env.AI_MONITORING_SLACK_WEBHOOK || process.env.SECURITY_SLACK_WEBHOOK
    if (!webhookUrl || !alert.failure) return

    const failure = alert.failure
    const severityEmoji = {
      medium: '🟡',
      high: '🔴', 
      critical: '🚨🚨'
    }

    const typeEmoji = {
      training: '🎓',
      inference: '🎨'
    }

    const payload = {
      channel: '#ai-gen-monitoring',
      username: 'AI Job Monitor',
      icon_emoji: ':robot_face:',
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : '#ffcc00',
        title: `${severityEmoji[alert.severity]} AI Job Alert: ${alert.type.replace(/_/g, ' ').toUpperCase()}`,
        text: this.formatAlertMessage(alert),
        fields: [
          {
            title: 'Job Type',
            value: `${typeEmoji[failure.jobType]} ${failure.jobType.charAt(0).toUpperCase() + failure.jobType.slice(1)}`,
            short: true
          },
          {
            title: 'Job ID',
            value: failure.jobId.substring(0, 8) + '...',
            short: true
          },
          {
            title: 'User ID',
            value: failure.userId.substring(0, 8) + '...',
            short: true
          },
          {
            title: 'Status',
            value: failure.status,
            short: true
          },
          ...(failure.errorMessage ? [{
            title: 'Error Message',
            value: failure.errorMessage.substring(0, 200) + (failure.errorMessage.length > 200 ? '...' : ''),
            short: false
          }] : []),
          ...(failure.retryCount ? [{
            title: 'Retry Count',
            value: failure.retryCount.toString(),
            short: true
          }] : []),
          ...(failure.creditsSpent ? [{
            title: 'Credits Spent',
            value: failure.creditsSpent.toString(),
            short: true
          }] : []),
          ...(alert.count ? [{
            title: 'Failure Count',
            value: `${alert.count} failures in ${alert.timeWindow}`,
            short: true
          }] : []),
          {
            title: 'Timestamp',
            value: new Date(failure.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'PrimeShot AI Job Monitor',
        ts: Math.floor(new Date(failure.timestamp).getTime() / 1000)
      }]
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error(`AI job Slack alert failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error sending AI job Slack alert:', error)
    }
  }

  // Get recent failures for monitoring dashboard
  getRecentFailures(limit: number = 50): AIJobFailure[] {
    return this.failures.slice(0, limit)
  }

  // Get failure statistics
  getFailureStats(hours: number = 24): {
    training: { total: number; failed: number }
    inference: { total: number; failed: number }
  } {
    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000)
    const recentFailures = this.failures.filter(f => new Date(f.timestamp) >= windowStart)

    return {
      training: {
        total: recentFailures.filter(f => f.jobType === 'training').length,
        failed: recentFailures.filter(f => f.jobType === 'training').length
      },
      inference: {
        total: recentFailures.filter(f => f.jobType === 'inference').length,
        failed: recentFailures.filter(f => f.jobType === 'inference').length
      }
    }
  }
}

// Global failure tracker instance
export const aiJobFailureTracker = new AIJobFailureTracker()

// Main function to report AI job failures
export function reportAIJobFailure(
  jobId: string,
  jobType: 'training' | 'inference',
  userId: string,
  status: string,
  options: {
    characterId?: string
    errorMessage?: string
    retryCount?: number
    creditsSpent?: number
    metadata?: Record<string, any>
  } = {}
): void {
  const failure: AIJobFailure = {
    jobId,
    jobType,
    userId,
    status,
    timestamp: new Date().toISOString(),
    ...options
  }

  aiJobFailureTracker.addFailure(failure)
}

// Helper function to report training job failure
export function reportTrainingFailure(
  jobId: string,
  userId: string,
  characterId: string,
  errorMessage: string,
  retryCount?: number,
  creditsSpent?: number
): void {
  reportAIJobFailure(jobId, 'training', userId, 'failed', {
    characterId,
    errorMessage,
    retryCount,
    creditsSpent
  })
}

// Helper function to report inference job failure  
export function reportInferenceFailure(
  jobId: string,
  userId: string,
  characterId: string,
  errorMessage: string,
  retryCount?: number,
  creditsSpent?: number
): void {
  reportAIJobFailure(jobId, 'inference', userId, 'failed', {
    characterId,
    errorMessage,
    retryCount,
    creditsSpent
  })
}
