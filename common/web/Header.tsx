'use client'

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';
import styles from './Header.module.css';

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <a href="/">
            <Image src="/logo-primeshot.svg" alt="Primeshot" width={32} height={32} />
          </a>
        </div>

        <div className={styles.middleSection}>
          {/* nav */}
          <nav className={styles.nav}>
            <a href="/explore" className={styles.navLink}>Explore</a>
            <a href="/create" className={styles.navLink}>Create</a>
            <a href="/use-cases" className={styles.navLink}>Use Cases</a>
            <a href="/pricing" className={styles.navLink}>Pricing</a>
            {isAuthenticated && user?.admin && (
              <a href="/admin/dashboard" className={styles.adminNavLink}>Admin</a>
            )}
          </nav>
        </div>

        <div className={styles.rightSection}>
          {/* right slot */}
          {rightSlot ?? (isAuthenticated ? <AccountDialog /> : <SignInModal />)}
        </div>
      </div>
    </header>
  );
};

export default Header; 