"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from '@primeshot/common/web/ui/dialog'
import { Icon, SignInForm } from '@primeshot/common/web'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'
import { useAuth } from '@/contexts/auth-context'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'
import { useTranslation } from 'react-i18next'
import styles from './CTASection.module.css'
import showcaseStyles from './ShowcaseSection.module.css'

export function CTASection() {
  const { t } = useTranslation('homepage')
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Auth and subscription state
  const { isAuthenticated } = useAuth()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus()
  const { saveIntent } = useGenerationIntent()

  // Handle button click based on auth and subscription status
  const handleCtaClick = () => {
    if (!isAuthenticated) {
      // User not signed in: save intent and open signin dialog
      saveIntent(0, 'subscribe')
      setIsSignInOpen(true)
    } else if (!hasActiveSubscription) {
      // User signed in but no subscription: redirect to pricing
      window.location.href = '/pricing'
    }
    // If user has active subscription, do nothing (button won't be rendered)
  }

  useEffect(() => {
    let rafId: number | null = null

    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        const ctaSection = document.getElementById('section-cta')
        if (!ctaSection) return

        const ctaRect = ctaSection.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportMiddle = viewportHeight / 2

        // Calculate CTA middle position relative to viewport top
        const ctaMiddleInViewport = ctaRect.top + (ctaRect.height / 2)

        // Visible when CTA middle is above viewport middle
        const shouldBeVisible = ctaMiddleInViewport < viewportMiddle

        setIsVisible(shouldBeVisible)
      })
    }

    // Initial check
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <>
      {/* Background Image */}
      <div className={styles.backgroundContainer}>
        <Image
          src={getWebsiteCdnUrl('/homepage/15.webp')}
          alt="Background"
          fill
          className={styles.backgroundImage}
          priority
        />
        {/* Overlay */}
        <div className={styles.overlay} />
      </div>

      <div 
        ref={contentRef}
        className={`${showcaseStyles.content} ${isVisible ? showcaseStyles.visible : ''} ${styles.contentContainer}`}
      >
        <div className={showcaseStyles.titleContainer}>
          <div className={showcaseStyles.iconWrapper + ' ' + styles.iconWrapper}>
            <Icon variant="generate" size={48} className="text-glacier" />
          </div>
          <h2 className={showcaseStyles.title + ' ' + styles.title}>
            {t('cta.title')}
          </h2>
          <p className={showcaseStyles.subtitle + ' ' + styles.description}>
            {t('cta.subtitle')}
          </p>
        </div>
        <p className={styles.subtitle + ' ' + showcaseStyles.subtitle}>
          {subscriptionLoading ? (
            <span>{t('cta.pricing')}</span>
          ) : isAuthenticated && hasActiveSubscription ? (
            <span>{t('cta.pricing')}</span>
          ) : (
            <Button variant="link" onClick={handleCtaClick}>
              {t('cta.pricing')}
            </Button>
          )}
        </p>
      </div>
      
      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <VisuallyHidden>
            <DialogTitle>{t('ctaHero.signInTitle')}</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <SignInForm />
        </DialogContent>
      </Dialog>
    </>
  )
}

