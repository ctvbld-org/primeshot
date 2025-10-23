"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@primeshot/common/web/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@primeshot/common/web/ui/dialog'
import { SignInForm } from '@primeshot/common/web'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'
import styles from './CTASection.module.css'

export function CTASection() {
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  return (
    <>
      {/* Background Image */}
      <div className={styles.backgroundContainer}>
        <Image
          src={getWebsiteCdnUrl('/explore/blindlight/15.webp')}
          alt="Background"
          fill
          className={styles.backgroundImage}
          priority
        />
        {/* Overlay */}
        <div className={styles.overlay} />
      </div>

      {/* Content */}
      <div className={styles.contentContainer}>
        <h2 className={styles.heading}>
          Ready to meet your best self?
        </h2>
        <p className={styles.paragraph}>
          Join thousands creating professional AI portraits with Primeshot
        </p>
        <Button 
          variant="primary"
          size="lg"
          className={styles.ctaButton}
          onClick={() => setIsSignInOpen(true)}
        >
          Get Started Now
        </Button>
      </div>

      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
          </DialogHeader>
          <SignInForm />
        </DialogContent>
      </Dialog>
    </>
  )
}

