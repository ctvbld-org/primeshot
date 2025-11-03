"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from '@primeshot/common/web/ui/dialog'
import { Icon, SignInForm } from '@primeshot/common/web'
import { getWebsiteCdnUrl } from '@primeshot/common/lib/utils/cdn'
import { useAuth } from '@/contexts/auth-context'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'
import { useTranslation } from 'react-i18next'
import styles from './CTASection.module.css'
import showcaseStyles from './ShowcaseSection.module.css'

type PositionMode = 'hidden' | 'fixed' | 'relative'

export function CTASection() {
  const { t } = useTranslation('homepage')
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [positionMode, setPositionMode] = useState<PositionMode>('hidden')
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

        // Calculate key positions
        const ctaTop = ctaRect.top
        const ctaTriggerPoint = ctaTop + 250 // Top of section + 200px
        const ctaMiddleInViewport = ctaTop + (ctaRect.height / 2)

        // Determine positioning mode based on scroll position
        if (ctaMiddleInViewport < viewportMiddle) {
          // Phase 3: Middle of section passed viewport middle - scroll naturally
          setPositionMode('relative')
        } else if (ctaTriggerPoint < viewportMiddle) {
          // Phase 2: Trigger point reached - stay fixed
          setPositionMode('fixed')
        } else {
          // Phase 1: Not yet reached trigger point - hidden
          setPositionMode('hidden')
        }
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

  // Determine content wrapper classes based on position mode
  const getContentClasses = () => {
    const baseClasses = [showcaseStyles.content, styles.contentContainer]
    
    if (positionMode === 'fixed') {
      baseClasses.push(styles.contentFixed)
      baseClasses.push(showcaseStyles.visible)
    } else if (positionMode === 'relative') {
      baseClasses.push(styles.contentRelative)
      baseClasses.push(showcaseStyles.visible)
    }
    // Hidden state uses default (no additional classes)
    
    return baseClasses.join(' ')
  }

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
        className={getContentClasses()}
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

