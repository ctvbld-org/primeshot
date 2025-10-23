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
import { usePathname } from 'next/navigation';

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useTranslation('common');
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <Link href="/">
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
                <a
                  href="/explore"
                  aria-current={isActive('/explore') ? 'page' : undefined}
                  className={
                    styles.navLink + ' ' +
                    styles.exploreNavLink + ' ' +
                    (isActive('/explore') ? styles.navLinkActive : '')
                  }
                >
                  {t('navigation.explore')}
                </a>
                <Link
                  href={"/"}
                  aria-current={isActive("/create") ? 'page' : undefined}
                  className={
                    styles.navLink + ' ' +
                    styles.createNavLink + ' ' +
                    (isActive("/create") ? styles.navLinkActive : '')
                  }
                >
                  {t('navigation.create')}
                </Link>
                {/* <a href="/use-cases" className={styles.navLink + ' ' + styles.useCasesNavLink}>Use Cases</a> */}
                <a href="/pricing" className={styles.navLink + ' ' + styles.pricingNavLink}>Pricing</a>
                {isAuthenticated && user?.admin && (
                  <a
                    href="/admin"
                    aria-current={isActive('/admin') ? 'page' : undefined}
                    className={
                      styles.navLink + ' ' +
                      styles.adminNavLink + ' ' +
                      (isActive('/admin') ? styles.navLinkActive : '')
                    }
                  >
                    {t('navigation.admin')}
                  </a>
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