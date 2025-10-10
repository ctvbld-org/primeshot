"use client"

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './SignInForm.module.css'
import { Input } from './ui/input'
import { Button } from './ui/button'
import Image from 'next/image';
import Link from 'next/link'
import { Icon } from './Icon'

export function SignInForm() {
  const { t } = useTranslation('auth')
  const { signIn, signInWithGoogle, signInWithLinkedIn, signInWithTwitter, isLoading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const heightRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Measure and animate height between sections for a seamless transition
  const updateHeight = () => {
    const target = showEmailForm ? emailRef.current : optionsRef.current
    if (heightRef.current && target) {
      heightRef.current.style.height = `${target.offsetHeight}px`
    }
  }

  useLayoutEffect(() => {
    updateHeight()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    updateHeight()
    const onResize = () => updateHeight()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmailForm])

  // Focus email input when email form becomes visible
  useEffect(() => {
    if (showEmailForm && emailInputRef.current) {
      // Small delay to ensure the transition animation completes
      const timer = setTimeout(() => {
        emailInputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [showEmailForm])

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email)
  }

  const providers: Array<{
    key: string
    name: string
    onClick?: () => void
    disabled?: boolean
  }> = [
    {
      key: 'google',
      name: 'Google',
      onClick: () => signInWithGoogle(),
    },
    {
      key: 'x',
      name: 'X',
      onClick: () => signInWithTwitter(),
      disabled: true,
    },
    {
      key: 'apple',
      name: 'Apple',
      disabled: true,
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      onClick: () => signInWithLinkedIn(),
    },
  ]

  return (
    <div className={styles.card}>
      <div className={styles.logoContainer}>
        <Image src={(process.env.NEXT_PUBLIC_AWS_DISTRIBUTION ? `${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg` : '/app-images/assets/logo-primeshot.svg')} alt="Primeshot" width={64} height={64} />
      </div>
      <div className={`${styles.headingContainer} ${showEmailForm ? styles.headingContainerLeft : ''}`}>
        {showEmailForm ? (
          <Button variant="ghost" size="sm" type="button" onClick={() => setShowEmailForm(false)}>
            <Icon variant="arrowLeft" className="text-[#2ADED8]" size={16} />
            <span>{t('signin.email.return', 'Return to sign in options')}</span>
          </Button>
        ) : (
          <h1 className={styles.heading}>{t('signin.title')}</h1>
        )}
      </div>

      <div className={styles.cardContent}>
        <div ref={heightRef} className={styles.heightContainer}>
        {/* Options section */}
        <div ref={optionsRef} className={`${styles.section} ${showEmailForm ? styles.sectionHidden : styles.sectionVisible}`}>
          <div className={styles.socialButtons}>
            {providers.map((p) => (
              (!p.disabled && (
                <Button
                  key={p.key}
                  variant="primary"
                  className={styles.socialButton}
                  onClick={p.onClick}
                  disabled={isLoading || !!p.disabled}
                >
                  <Icon variant={p.key as never} size={16} />
                  <span>{t('signin.social.button')}{p.name}{t('signin.social.suffix', '')}</span>
                </Button>
              ))
            ))}
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine}></span>
            <span className={styles.dividerText}>{t('signin.divider.text')}</span>
            <span className={styles.dividerLine}></span>
          </div>

          <Button
            variant="primary"
            className={styles.emailButton}
            onClick={() => setShowEmailForm(true)}
            disabled={isLoading}
          >
            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="16" height="16" transform="translate(0.5)" fill="white" style={{ mixBlendMode: 'multiply' }}/>
              <path d="M14.5 3H2.5C2.23478 3 1.98043 3.10536 1.79289 3.29289C1.60536 3.48043 1.5 3.73478 1.5 4V12C1.5 12.2652 1.60536 12.5196 1.79289 12.7071C1.98043 12.8946 2.23478 13 2.5 13H14.5C14.7652 13 15.0196 12.8946 15.2071 12.7071C15.3946 12.5196 15.5 12.2652 15.5 12V4C15.5 3.73478 15.3946 3.48043 15.2071 3.29289C15.0196 3.10536 14.7652 3 14.5 3ZM13.4 4L8.5 7.39L3.6 4H13.4ZM2.5 12V4.455L8.215 8.41C8.2987 8.46806 8.39813 8.49918 8.5 8.49918C8.60187 8.49918 8.7013 8.46806 8.785 8.41L14.5 4.455V12H2.5Z" fill="#161616"/>
            </svg>
            <span>{t('signin.email.button')}</span>
          </Button>
        </div>

        {/* Email form section */}
        <div ref={emailRef} className={`${styles.section} ${showEmailForm ? styles.sectionVisible : styles.sectionHidden}`}>
          <form onSubmit={handleEmail} className={styles.form}>
            <Input
              ref={emailInputRef}
              autoFocus
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              placeholder={t('signin.emailInput.placeholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {error && <p className={styles.errorMessage}>{error.message}</p>}
            <Button
              variant="primary"
              className={styles.submitButton}
              type="submit"
              disabled={isLoading}
            >
              {t('signin.emailInput.sendButton')}
            </Button>
          </form>
        </div>
        </div>
      </div>

      <p className={styles.terms}>
        {t('signin.terms.text')} <Link href="/terms" className={styles.termsLink}>{t('signin.terms.termsLink')}</Link> {t('signin.terms.and')} <Link href="/privacy" className={styles.termsLink}>{t('signin.terms.privacyLink')}</Link>{t('signin.terms.ageConsent')}
      </p>
    </div>
  )
} 