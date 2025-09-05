'use client'

import { useEffect } from 'react'

// Initialize i18n configuration
import '@/i18n'

export function I18nInitializer() {
  useEffect(() => {
    // i18n is already initialized by the import above
    // This component ensures it happens at the right time in the React lifecycle
  }, [])
  
  return null
}
