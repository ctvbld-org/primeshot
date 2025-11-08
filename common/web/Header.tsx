'use client'

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to complete before rendering auth-dependent UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <a href="/">
            <Image src={(`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`)} alt={t('aria.brandLogo')} width={32} height={32} priority />
          </a>
        </div>

        <div className={styles.middleSection}>       
          <nav className={styles.nav}>
            {!mounted || isLoading ? (
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
                <a
                  href="/create"
                  aria-current={isActive("/create") ? 'page' : undefined}
                  className={
                    styles.navLink + ' ' +
                    styles.createNavLink + ' ' +
                    (isActive("/create") ? styles.navLinkActive : '')
                  }
                >
                  {t('navigation.create')}
                </a>
                {/* <a href="/use-cases" className={styles.navLink + ' ' + styles.useCasesNavLink}>Use Cases</a> */}
                <a href="/pricing" className={styles.navLink + ' ' + styles.pricingNavLink}>{t('navigation.pricing')}</a>
                <a
                  href="/blog"
                  aria-current={isActive("/blog") ? 'page' : undefined}
                  className={
                    styles.navLink + ' ' +
                    styles.blogNavLink + ' ' +
                    (isActive("/blog") ? styles.navLinkActive : '')
                  }
                >
                  {t('navigation.blog')}
                </a>
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
            {!mounted || isLoading ? (
              <>
                <Skeleton className={styles.rightSkeleton + ' ' + styles.skeleton} />
                <Skeleton className={styles.rightSkeleton + ' ' + styles.skeleton} />
              </>
            ) : (
              <>
                {!isAuthenticated && <LanguageSwitcher variant="modal" display="flag" />}
                {rightSlot ?? (isAuthenticated ? <AccountDialog /> : <SignInModal />)}
                
                {/* Mobile Menu */}
                <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.hamburgerButton}
                      aria-label={t('navigation.menu')}
                    >
                      <Icon variant="menu" size={20} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={styles.mobileNavDialog} noContainer fullscreen>
                    <DialogHeader />
                    <div className={styles.mobileNavList}>
                      <a
                        href="/explore"
                        aria-current={isActive('/explore') ? 'page' : undefined}
                        className={styles.mobileNavItem + (isActive('/explore') ? ' ' + styles.mobileNavItemActive : '')}
                        onClick={handleMobileNavClick}
                      >
                        <span className={styles.mobileNavLabel}>{t('navigation.explore')}</span>
                        {isActive('/explore') && <Icon variant="checkmark" className={styles.mobileNavCheck} />}
                      </a>
                      <Link
                        href="/create"
                        aria-current={isActive("/create") ? 'page' : undefined}
                        className={styles.mobileNavItem + (isActive("/create") ? ' ' + styles.mobileNavItemActive : '')}
                        onClick={handleMobileNavClick}
                      >
                        <span className={styles.mobileNavLabel}>{t('navigation.create')}</span>
                        {isActive("/create") && <Icon variant="checkmark" className={styles.mobileNavCheck} />}
                      </Link>
                      <a
                        href="/pricing"
                        aria-current={isActive('/pricing') ? 'page' : undefined}
                        className={styles.mobileNavItem + (isActive('/pricing') ? ' ' + styles.mobileNavItemActive : '')}
                        onClick={handleMobileNavClick}
                      >
                        <span className={styles.mobileNavLabel}>{t('navigation.pricing')}</span>
                        {isActive('/pricing') && <Icon variant="checkmark" className={styles.mobileNavCheck} />}
                      </a>
                      {isAuthenticated && user?.admin && (
                        <a
                          href="/admin"
                          aria-current={isActive('/admin') ? 'page' : undefined}
                          className={styles.mobileNavItem + (isActive('/admin') ? ' ' + styles.mobileNavItemActive : '')}
                          onClick={handleMobileNavClick}
                        >
                          <span className={styles.mobileNavLabel}>{t('navigation.admin')}</span>
                          {isActive('/admin') && <Icon variant="checkmark" className={styles.mobileNavCheck} />}
                        </a>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header; 