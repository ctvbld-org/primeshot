"use client"

import React, { useState } from 'react'
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
  const { signIn, signInWithGoogle, signInWithLinkedIn, isLoading, error } = useAuth()
  const [email, setEmail] = useState('')

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn(email)
  }

  return (
    <div className={styles.card}>
      <div className={styles.logoContainer}>
        <Image src="/logo-primeshot.svg" alt="Primeshot" width={64} height={64} />
      </div>
      <div className={styles.headingContainer}>
        <h1 className={styles.heading}>{t('signin.title')}</h1>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.socialButtons}>
          <Button
            variant="primary"
            className={styles.socialButton}
            onClick={() => signInWithGoogle()}
            disabled={isLoading}
          >
            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5017 8.15571C15.5017 7.58016 15.454 7.16016 15.3509 6.72461H8.64453V9.32236H12.581C12.5017 9.96793 12.0731 10.9402 11.1207 11.5935L11.1074 11.6804L13.2278 13.2902L13.3747 13.3046C14.7239 12.0835 15.5017 10.2868 15.5017 8.15571Z" fill="#4285F4"/>
              <path d="M8.64266 14.9999C10.5712 14.9999 12.1902 14.3776 13.3728 13.3043L11.1188 11.5931C10.5157 12.0054 9.70613 12.2932 8.64266 12.2932C6.75379 12.2932 5.15064 11.0721 4.57916 9.38428L4.49539 9.39125L2.29055 11.0635L2.26172 11.142C3.43631 13.4287 5.849 14.9999 8.64266 14.9999Z" fill="#34A853"/>
              <path d="M4.57933 9.38448C4.42854 8.94893 4.34127 8.48223 4.34127 8.00003C4.34127 7.51778 4.42854 7.05113 4.5714 6.61558L4.5674 6.52282L2.33493 4.82373L2.26189 4.85778C1.77778 5.80668 1.5 6.87226 1.5 8.00003C1.5 9.1278 1.77778 10.1933 2.26189 11.1422L4.57933 9.38448Z" fill="#FBBC05"/>
              <path d="M8.6427 3.70665C9.98395 3.70665 10.8887 4.27442 11.4046 4.7489L13.4205 2.82C12.1824 1.69222 10.5712 1 8.6427 1C5.84902 1 3.43631 2.5711 2.26172 4.85775L4.57124 6.61555C5.15066 4.92777 6.75382 3.70665 8.6427 3.70665Z" fill="#EB4335"/>
            </svg>
            <span>{t('signin.google.button')}</span>
          </Button>
          <Button
            variant="primary"
            className={styles.socialButton}
            // onClick={() => signInWithApple()}
            disabled={isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.6508 11.9102C13.4391 12.3994 13.1885 12.8496 12.8981 13.2635C12.5023 13.8278 12.1783 14.2185 11.9285 14.4354C11.5414 14.7914 11.1266 14.9737 10.6824 14.9841C10.3635 14.9841 9.97894 14.8934 9.5313 14.7093C9.08219 14.5261 8.66946 14.4354 8.29208 14.4354C7.89629 14.4354 7.4718 14.5261 7.01777 14.7093C6.56304 14.8934 6.19672 14.9893 5.91664 14.9988C5.49069 15.0169 5.06612 14.8294 4.64233 14.4354C4.37185 14.1994 4.03352 13.795 3.62823 13.2221C3.19337 12.6102 2.83587 11.9007 2.55579 11.0919C2.25583 10.2182 2.10547 9.37218 2.10547 8.55312C2.10547 7.61489 2.3082 6.80568 2.71428 6.12756C3.03342 5.58287 3.45798 5.15321 3.98936 4.83779C4.52074 4.52236 5.0949 4.36163 5.71321 4.35134C6.05154 4.35134 6.4952 4.456 7.04654 4.66167C7.59633 4.86803 7.94935 4.97268 8.10412 4.97268C8.21983 4.97268 8.61199 4.85032 9.2768 4.60636C9.90548 4.38012 10.4361 4.28644 10.8708 4.32334C12.0486 4.4184 12.9335 4.88272 13.522 5.71924C12.4686 6.35752 11.9475 7.2515 11.9579 8.39834C11.9674 9.29164 12.2915 10.035 12.9284 10.6252C13.217 10.8992 13.5393 11.1109 13.898 11.2613C13.8202 11.4868 13.7381 11.7028 13.6508 11.9102ZM10.9494 1.28008C10.9494 1.98024 10.6936 2.63398 10.1837 3.23907C9.56846 3.95841 8.82423 4.37407 8.01718 4.30848C8.0069 4.22448 8.00094 4.13608 8.00094 4.04318C8.00094 3.37103 8.29354 2.65169 8.81317 2.06354C9.0726 1.76574 9.40254 1.51813 9.80265 1.32061C10.2019 1.12603 10.5795 1.01843 10.9347 1C10.9451 1.0936 10.9494 1.18722 10.9494 1.28008Z" fill="black"/>
            </svg>
            <span>{t('signin.apple.button')}</span>
          </Button>
          <Button
            variant="primary"
            className={styles.socialButton}
            onClick={() => signInWithLinkedIn()}
            disabled={isLoading}
          >
            {/* linkedin icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452H17.24v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.135 1.445-2.135 2.935v5.671H9.046V9h3.072v1.561h.043c.428-.81 1.473-1.66 3.034-1.66 3.245 0 3.843 2.136 3.843 4.917v6.633zM5.337 7.433a1.792 1.792 0 110-3.585 1.792 1.792 0 010 3.585zM6.863 20.452H3.806V9h3.057v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.728v20.543C0 23.225.792 24 1.771 24h20.451C23.205 24 24 23.225 24 22.271V1.728C24 .774 23.205 0 22.225 0z"/></svg>
            <span>{t('signin.linkedin.button')}</span>
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
      </div>

      <p className={styles.terms}>
        {t('signin.terms.text')} <Link href="/terms" className={styles.termsLink}>{t('signin.terms.termsLink')}</Link> {t('signin.terms.and')} <Link href="/privacy" className={styles.termsLink}>{t('signin.terms.privacyLink')}</Link>{t('signin.terms.ageConsent')}
      </p>
    </div>
  )
} 