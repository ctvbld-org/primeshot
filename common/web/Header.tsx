'use client'

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '../hooks/AuthContext';
import { SignInModal } from './SignInModal';
import { AccountDialog } from './AccountDialog';

interface HeaderProps {
  /** Optional element rendered on the right side (e.g. login button). */
  rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ rightSlot }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="w-full h-14 border-b border-gray-200 flex items-center px-4">
      <div className="flex items-center gap-8 w-full max-w-6xl mx-auto">
        {/* logo */}
        <a href="/">
          <Image src="/logo-primeshot.svg" alt="Primeshot" width={32} height={32} />
        </a>

        {/* nav */}
        <nav className="flex gap-6 text-sm font-medium">
          <a href="/explore">Explore</a>
          <a href="/create">Create</a>
          <a href="/use-cases">Use Cases</a>
          <a href="/pricing">Pricing</a>
          {isAuthenticated && user?.admin && (
            <a href="/admin/dashboard" className="text-purple-600 font-semibold">Admin</a>
          )}
        </nav>

        {/* spacer */}
        <div className="flex-1" />

        {/* right slot */}
        {rightSlot ?? (isAuthenticated ? <AccountDialog /> : <SignInModal />)}
      </div>
    </header>
  );
};

export default Header; 