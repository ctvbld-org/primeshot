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
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full h-14 border-b border-gray-200 flex items-center px-4">
      <div className="flex items-center gap-8 w-full max-w-6xl mx-auto">
        {/* logo */}
        <Link href="/">
          <Image src="/logo.svg" alt="Primeshot" width={32} height={32} />
        </Link>

        {/* nav */}
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/explore">Explore</Link>
          <Link href="/create">Create</Link>
          <Link href="/use-cases">Use Cases</Link>
          <Link href="/pricing">Pricing</Link>
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