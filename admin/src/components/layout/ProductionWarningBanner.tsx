'use client'

import { TopBanner } from '@primeshot/common/web/ui/top-banner'
import { useEffect } from 'react'

export function ProductionWarningBanner() {
  // Check if we're in production environment
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production'

  useEffect(() => {
    // Set CSS custom property for banner height when banner is shown
    if (isProduction) {
      document.documentElement.style.setProperty('--admin-banner-height', '64px')
    } else {
      document.documentElement.style.setProperty('--admin-banner-height', '0px')
    }
  }, [isProduction])

  if (!isProduction) {
    return null
  }

  return (
    <TopBanner
      variant="destructive"
      title="⚠️ PRODUCTION ENVIRONMENT"
      description="You are currently in the production admin portal. Please be extremely careful when making changes to the database as they will affect live users."
      showClose={false}
      className="relative z-50"
    />
  )
} 