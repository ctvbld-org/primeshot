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
import { Skeleton } from './ui/skeleton';
import { usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { SUPPORTED_LANGUAGES } from '../i18n';

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
    
    // Get the full URL path (e.g., when webapp is served at /create, this will be /create)
    // while Next.js pathname might be / due to basePath
    const fullPathname = typeof window !== 'undefined' ? window.location.pathname : pathname;
    
    // Helper to remove locale prefix from any pathname
    const removeLocalePrefix = (path: string) => {
      for (const locale of SUPPORTED_LANGUAGES) {
        if (path === `/${locale}` || path.startsWith(`/${locale}/`)) {
          return path.slice(locale.length + 1) || '/';
        }
      }
      return path;
    };
    
    // Remove locale prefix from both paths
    const nextPathnameWithoutLocale = removeLocalePrefix(pathname);
    const fullPathnameWithoutLocale = removeLocalePrefix(fullPathname);
    
    // Check against both paths (handles webapp served via rewrite with basePath)
    const checkPath = (path: string) => {
      if (href === '/') return path === '/';
      return path === href || path.startsWith(href + '/');
    };
    
    return checkPath(nextPathnameWithoutLocale) || checkPath(fullPathnameWithoutLocale);
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  // Define navigation items
  const navItems = [
    { href: '/explore', labelKey: 'navigation.explore', desktopClass: styles.exploreNavLink },
    { href: '/create', labelKey: 'navigation.create', desktopClass: styles.createNavLink },
    { href: '/pricing', labelKey: 'navigation.pricing', desktopClass: styles.pricingNavLink },
    { href: '/blog', labelKey: 'navigation.blog', desktopClass: styles.blogNavLink },
  ];

  // Add admin link if user is admin
  if (isAuthenticated && user?.admin) {
    navItems.push({ href: '/admin', labelKey: 'navigation.admin', desktopClass: styles.adminNavLink });
  }

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
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={
                      styles.navLink + ' ' +
                      item.desktopClass + ' ' +
                      (isActive(item.href) ? styles.navLinkActive : '')
                    }
                  >
                    {t(item.labelKey)}
                  </a>
                ))}
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
                      {navItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                          className={styles.mobileNavItem + (isActive(item.href) ? ' ' + styles.mobileNavItemActive : '')}
                          onClick={handleMobileNavClick}
                        >
                          <span className={styles.mobileNavLabel}>{t(item.labelKey)}</span>
                          {isActive(item.href) && <Icon variant="checkmark" className={styles.mobileNavCheck} />}
                        </a>
                      ))}
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