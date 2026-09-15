'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@primeshot/common'
import { SignInForm } from '@primeshot/common/web/SignInForm'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const pathname = usePathname()
  const retriedProfile = useRef(false)
  const isAuthRoute = pathname?.startsWith('/auth')

  useEffect(() => {
    if (retriedProfile.current) return
    if (!isLoading && isAuthenticated && user && user.admin !== true) {
      retriedProfile.current = true
      void refreshUser()
    }
  }, [isLoading, isAuthenticated, user, refreshUser])

  if (isAuthRoute) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <SignInForm />
      </div>
    )
  }

  if (user.admin !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          Only admin users can access this area.
        </div>
      </div>
    )
  }

  return <>{children}</>
}


