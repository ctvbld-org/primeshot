'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { SignInModal } from '@primeshot/common/web/SignInModal'
import { AccountDialog } from '@primeshot/common/web/AccountDialog'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const AdminHeader: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (!isAuthenticated || !user) return
    
    // Check if user is admin
    if (user && !user.admin) {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  return (
    <header className="w-full h-14 border-b border-gray-200 flex items-center px-4 bg-white">
      <div className="flex items-center gap-8 w-full max-w-7xl mx-auto">
        {/* logo */}
        <Link href="/dashboard">
          <Image src="/logo-primeshot.svg" alt="Primeshot Admin" width={32} height={32} />
        </Link>

        {/* admin badge */}
        {isAuthenticated && user?.admin && (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Admin
          </span>
        )}

        {/* spacer */}
        <div className="flex-1" />

        {/* link to main app */}
        <Link href="/app/albums" className="text-sm text-gray-600 hover:text-gray-900">
          Go to App
        </Link>

        {/* right slot */}
        {isAuthenticated ? <AccountDialog /> : <SignInModal />}
      </div>
    </header>
  )
}