'use client'

import Image from 'next/image';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';
import { Icon } from './Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useTranslation('common');

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <Link href="/create">
            <Image src={(`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`)} alt={t('aria.brandLogo')} width={32} height={32} />
          </Link>
        </div>

        <div className={styles.middleSection}>       
          <nav className={styles.nav}>
            {isLoading ? (
              <>
                <Skeleton className={styles.navLinkSkeleton + ' ' + styles.skeleton} />
                <Skeleton className={styles.navLinkSkeleton + ' ' + styles.skeleton} />
                <Skeleton className={styles.navLinkSkeleton + ' ' + styles.skeleton} />
                <Skeleton className={styles.navLinkSkeleton + ' ' + styles.skeleton} />
              </>
            ) : (
              <>
                <Link href="/explore" className={styles.navLink}>{t('navigation.explore')}</Link>
                <Link href="/create" className={styles.navLink}>{t('navigation.create')}</Link>
                {/* <Link href="/use-cases" className={styles.navLink}>Use Cases</Link> */}
                {/* <Link href="/pricing" className={styles.navLink}>Pricing</Link> */}
                {isAuthenticated && user?.admin && (
                  <Link href="/admin" className={styles.navLink + ' ' + styles.adminNavLink}>{t('navigation.admin')}</Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className={styles.rightSection}>
            {isLoading ? (
              <>
                <Skeleton className={styles.rightSkeleton + ' ' + styles.skeleton} />
                <Skeleton className={styles.rightSkeleton + ' ' + styles.skeleton} />
              </>
            ) : (
              <>
                {!isAuthenticated && <LanguageSwitcher variant="modal" display="flag" />}
                {rightSlot ?? (isAuthenticated ? <AccountDialog /> : <SignInModal />)}
              </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header; 