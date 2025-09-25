'use client'

import React from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n-client'

interface I18nProviderProps {
  children: React.ReactNode
}

/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 */
export function I18nProvider({ children }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}

export default I18nProvider
