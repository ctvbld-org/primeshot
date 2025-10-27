'use client'

import { useState } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@primeshot/common/web/Icon'
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from '@primeshot/common/web/ui/dialog'
import { SignInForm } from '@primeshot/common/web'
import { useAuth } from '@/contexts/auth-context'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'
import { useTranslation } from 'react-i18next'
import styles from './CTAHero.module.css'

export function CTAHero() {
  const { t } = useTranslation('homepage')
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  
  // Auth and subscription state
  const { isAuthenticated, signInWithGoogle } = useAuth()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus()
  const { saveIntent } = useGenerationIntent()

  const handleGoogleSignIn = async () => {
    // Save intent before signing in
    saveIntent(0, 'subscribe')
    
    // Trigger Google OAuth sign-in (will redirect to Google)
    await signInWithGoogle()
  }

  const handleCreateShoot = () => {
    if (!isAuthenticated) {
      // User not signed in: save intent and open signin dialog
      saveIntent(0, 'create_shoot')
      setIsSignInOpen(true)
    } else if (!hasActiveSubscription) {
      // User signed in but no subscription: redirect to pricing
      window.location.href = '/pricing'
    } else {
      // User has active subscription: redirect to create page
      window.location.href = '/create'
    }
  }

  return (
    <>
      <section className={styles.ctaHero}>
        <div className={styles.container}>
          <h1 className={styles.heading}>
            {t('ctaHero.heading')}
            {t('ctaHero.subheading')}
          </h1>
          
          <div className={styles.buttonGroup}>
            {!isAuthenticated && (
              <Button
                variant="secondary"
                size="md"
                icon={<Icon variant="google" size={20} />}
                iconSide="left"
                onClick={handleGoogleSignIn}
                className={styles.googleButton}
              >
                {t('ctaHero.googleButton')}
              </Button>
            )}
            
            <Button
              variant="tertiary"
              size="md"
              icon={<Icon variant="generate" size={20} />}
              iconSide="left"
              onClick={handleCreateShoot}
              className={styles.createButton}
              disabled={subscriptionLoading}
            >
              {t('ctaHero.createButton')}
            </Button>
          </div>
        </div>
      </section>

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

