'use client'

import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.css'
import { Icon } from './Icon'

export interface FooterProps {
  aboutHref?: string
  termsHref?: string
  privacyHref?: string
  xHref?: string
  linkedinHref?: string
  instagramHref?: string
}

export const Footer: React.FC<FooterProps> = ({
  aboutHref = '/about',
  termsHref = '/terms',
  privacyHref = '/privacy',
  xHref = 'https://x.com/primeshotai',
  linkedinHref = 'https://www.linkedin.com/company/primeshotai',
  instagramHref = 'https://www.instagram.com/primeshotai',
}) => {
  const { t } = useTranslation('common')
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
            <Link href="/" aria-label="Primeshot home">
                <Icon variant="primeshotLogo" size={118} className={styles.logo} />
            </Link>
            <div className={styles.copyright}>
            {t('footer.copyright', { year })}
            </div>
        </div>

          <div className={styles.right}>
            <a className={styles.link} href={aboutHref}>{t('footer.about')}</a>
            <a className={styles.link} href={termsHref}>{t('footer.terms')}</a>
            <a className={styles.link} href={privacyHref}>{t('footer.privacy')}</a>
            <div className={styles.socialIcons}>
                <a className={styles.iconLink} href={xHref} target="_blank" rel="noopener noreferrer" aria-label="X">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-x.png`}
                        alt="X"
                        width={24}
                        height={24}
                        className={styles.icon}
                    />
                </a>
                <a className={styles.iconLink} href={linkedinHref} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-ig.png`}
                        alt="X"
                        width={24}
                        height={24}
                        className={styles.icon}
                    />
                </a>
                <a className={styles.iconLink} href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/website-images/email/base-icon-ln.png`}
                        alt="X"
                        width={24}
                        height={24}
                        className={styles.icon}
                    />
                </a>
            </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


