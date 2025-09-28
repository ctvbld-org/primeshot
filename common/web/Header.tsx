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

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation('common');

  // Right content can be provided by consumer app via rightSlot

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <a href="/create">
            <Image src={(`${process.env.NEXT_PUBLIC_AWS_DISTRIBUTION}/app-images/assets/logo-primeshot.svg`)} alt={t('aria.brandLogo')} width={32} height={32} />
          </a>
        </div>

        <div className={styles.middleSection}>
          {/* nav */}
          <nav className={styles.nav}>
            <a href="/explore" className={styles.navLink}>{t('navigation.explore')}</a>
            <a href="/create" className={styles.navLink}>{t('navigation.create')}</a>
           {/* <Link href="/use-cases" className={styles.navLink}>Use Cases</Link>
            <Link href="/pricing" className={styles.navLink}>Pricing</Link> */}
            {isAuthenticated && user?.admin && (
              <a href="/admin" className={styles.navLink + ' ' + styles.adminNavLink}>{t('navigation.admin')}</a>
            )}
          </nav>
        </div>

        <div className={styles.rightSection}>
          {!isAuthenticated && <LanguageSwitcher variant="modal" display="flag" />}
          {rightSlot ?? (isAuthenticated ? <AccountDialog /> : <SignInModal />)}
        </div>
      </div>
    </header>
  );
};

export default Header; 