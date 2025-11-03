'use client'

import React, { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n-client'

interface I18nProviderProps {
  children: React.ReactNode
  locale?: string
}

/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 * Accepts optional locale to ensure server/client language sync
 */
export function I18nProvider({ children, locale }: I18nProviderProps) {
  // Set language in useEffect to avoid calling async operations during render
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale])
  
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}

export default I18nProvider
