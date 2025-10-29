'use client'

import React from 'react'
import { I18nextProvider } from 'react-i18next'
import { initServerI18n } from './i18n-server'

interface I18nServerProviderProps {
  children: React.ReactNode
  language: string
}

/**
 * Server-side I18n Provider component
 * Initializes i18n with the language from server-side cookies
 */
export function I18nServerProvider({ children, language }: I18nServerProviderProps) {
  const serverI18n = initServerI18n(language)
  
  return (
    <I18nextProvider i18n={serverI18n}>
      {children}
    </I18nextProvider>
  )
}

export default I18nServerProvider
