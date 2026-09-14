'use client'

import React, { useEffect, useRef } from 'react'
import { useAuth } from '@primeshot/common'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth()
  const retriedProfile = useRef(false)

  useEffect(() => {
    if (retriedProfile.current) return
    if (!isLoading && isAuthenticated && user && user.admin !== true) {
      retriedProfile.current = true
      void refreshUser()
    }
  }, [isLoading, isAuthenticated, user, refreshUser])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          Sign in on this site first, then open Admin.
        </div>
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


