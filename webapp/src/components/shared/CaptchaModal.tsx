'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { Loader } from '@primeshot/common/web/ui/loader'
import { getTurnstileConfig, verifyTurnstileToken } from '@/lib/bot-protection'
import { useTranslation } from 'react-i18next'

interface CaptchaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (token: string) => void
  onError: (error: string) => void
  action?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: string | HTMLElement, config: any) => string
      reset: (widgetId: string) => void
      getResponse: (widgetId: string) => string
    }
  }
}

export function CaptchaModal({ isOpen, onClose, onSuccess, onError, action = 'generic' }: CaptchaModalProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [widgetId, setWidgetId] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const turnstileConfig = getTurnstileConfig()

  // Initialize Turnstile widget when modal opens
  useEffect(() => {
    if (isOpen && turnstileConfig.enabled && widgetRef.current && !widgetId) {
      // Load Turnstile script if not already loaded
      if (!document.querySelector('script[src*="challenges.cloudflare.com"]')) {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }

      // Wait for script to load and initialize widget
      const initWidget = () => {
        if (window.turnstile && widgetRef.current) {
          const id = window.turnstile.render(widgetRef.current, {
            sitekey: turnstileConfig.siteKey,
            action: action,
            callback: (token: string) => {
              handleCaptchaSuccess(token)
            },
            'expired-callback': () => {
              handleCaptchaExpired()
            },
            'error-callback': (error: string) => {
              handleCaptchaError(error)
            }
          })
          setWidgetId(id)
        }
      }

      // Check if script is already loaded
      if (window.turnstile) {
        initWidget()
      } else {
        // Wait for script to load
        const checkScript = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkScript)
            initWidget()
          }
        }, 100)

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkScript)
          if (!widgetId) {
            onError(t('captcha.error_loading', 'Failed to load CAPTCHA. Please refresh and try again.'))
          }
        }, 10000)
      }
    }
  }, [isOpen, turnstileConfig.enabled, widgetId, action, onError, t])

  // Reset widget when modal closes
  useEffect(() => {
    if (!isOpen && widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
      setWidgetId(null)
    }
  }, [isOpen, widgetId])

  const handleCaptchaSuccess = async (token: string) => {
    setIsLoading(true)
    try {
      // Verify the token with our backend (optional but recommended for security)
      // For now, we'll just pass it through since the verification happens server-side
      onSuccess(token)
    } catch (error) {
      onError(t('captcha.verification_failed', 'CAPTCHA verification failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaExpired = () => {
    onError(t('captcha.expired', 'CAPTCHA expired. Please try again.'))
  }

  const handleCaptchaError = (error: string) => {
    onError(t('captcha.error', 'CAPTCHA error occurred. Please try again.'))
  }

  const handleRetry = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId)
    }
  }

  if (!turnstileConfig.enabled) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('captcha.title', 'Verify you are human')}</DialogTitle>
          <DialogDescription>
            {t('captcha.description', 'Please complete the verification to continue.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div
            ref={widgetRef}
            className="turnstile-widget"
            style={{
              minHeight: '65px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />

          {isLoading && (
            <div className="flex items-center space-x-2">
              <Loader className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">
                {t('captcha.verifying', 'Verifying...')}
              </span>
            </div>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              {t('captcha.retry', 'Retry')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
