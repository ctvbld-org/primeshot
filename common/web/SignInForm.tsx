"use client"

import React, { useState } from 'react'
import { useAuth } from '../hooks/AuthContext'
import { useTranslation } from 'react-i18next'
import styles from './SignInForm.module.css'
import { Input } from './ui/input'
import { Button } from './ui/button'
import Link from 'next/link'
import { Icon } from './Icon'

export function SignInForm() {
  const { t } = useTranslation('auth')
  const { signIn, signInWithGoogle, signInWithLinkedIn, isLoading, error } = useAuth()
  const [email, setEmail] = useState('')

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email)
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.logoContainer}>
          <Icon variant="camera" size={48} className={styles.logo} />
        </div>
        <div className={styles.headingContainer}>
          <h1 className={styles.heading}>{t('signin.getStarted.title')}</h1>
          <p className={styles.subheading}>{t('signin.getStarted.description')}</p>
        </div>

        <div className={styles.socialButtons}>
          <Button
            variant="ghost"
            className={styles.socialButton}
            onClick={() => signInWithGoogle()}
            disabled={isLoading}
          >
            {/* google icon */}
            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.8v3.6h5.1c-.2 1.2-1.6 3.4-5.1 3.4-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 4 14.6 3 12 3 6.6 3 2.2 7.4 2.2 12.8S6.6 22.6 12 22.6c6.1 0 10.1-4.3 10.1-10.4 0-.7-.1-1.2-.2-1.6H12z"/></svg>
          </Button>
          <Button
            variant="ghost"
            className={styles.socialButton}
            onClick={() => signInWithLinkedIn()}
            disabled={isLoading}
          >
            {/* linkedin icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452H17.24v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.135 1.445-2.135 2.935v5.671H9.046V9h3.072v1.561h.043c.428-.81 1.473-1.66 3.034-1.66 3.245 0 3.843 2.136 3.843 4.917v6.633zM5.337 7.433a1.792 1.792 0 110-3.585 1.792 1.792 0 010 3.585zM6.863 20.452H3.806V9h3.057v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.728v20.543C0 23.225.792 24 1.771 24h20.451C23.205 24 24 23.225 24 22.271V1.728C24 .774 23.205 0 22.225 0z"/></svg>
          </Button>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerLine}></span>
          <span className={styles.dividerText}>{t('signin.divider.text')}</span>
          <span className={styles.dividerLine}></span>
        </div>

        <form onSubmit={handleEmail} className={styles.form}>
          <Input
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
            <Icon variant="arrowRight" className={styles.arrowRight} />
          </Button>
        </form>

        <p className={styles.terms}>
          {t('signin.terms.text')} <Link href="/terms" className={styles.termsLink}>{t('signin.terms.termsLink')}</Link> {t('signin.terms.and')} <Link href="/privacy" className={styles.termsLink}>{t('signin.terms.privacyLink')}</Link>
        </p>
      </div>
    </div>
  )
} 