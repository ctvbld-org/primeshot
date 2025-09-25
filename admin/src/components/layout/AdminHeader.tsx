'use client'

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '@primeshot/common';
import { AccountDialog } from '@primeshot/common/web/AccountDialog';
import styles from './AdminHeader.module.css';
import { Button } from '@primeshot/common/web/ui/button';
import { useRouter, usePathname } from 'next/navigation';

export const AdminHeader: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          {/* logo */}
          <Link href="/dashboard">
            <Image 
              src="/logo-primeshot.svg" 
              alt="Primeshot Admin" 
              width={32} 
              height={32} 
            />
          </Link>
        </div>

        <div className={styles.middleSection}>
          {/* nav */}
          <nav className={styles.nav}>
            {[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Styles', path: '/styles' },
              { label: 'Media', path: '/media' },
              { label: 'Subscriptions', path: '/subscriptions' },
              { label: 'Inference', path: '/inference' },
            ].map(({ label, path }) => (
              <Button
                key={path}
                variant={pathname === path ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => router.push(path)}
                className={styles.navLink}
              >
                {label}
              </Button>
            ))}
          </nav>
        </div>

        <div className={styles.rightSection}>
          {isAuthenticated && <AccountDialog />}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
