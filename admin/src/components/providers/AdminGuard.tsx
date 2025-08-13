'use client'

import React from 'react'
import { useAuth } from '@primeshot/common'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user?.admin) {
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


