'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageContextType {
  currentLanguage: string | null
  isLoading: boolean
  setLanguage: (lang: string) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true)
        const saved = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null
        const fallbackOpt = i18n.options.fallbackLng
        const fallback = Array.isArray(fallbackOpt)
          ? (fallbackOpt[0] as string)
          : (typeof fallbackOpt === 'string' ? (fallbackOpt as string) : 'en')
        const lang = saved || fallback
        await i18n.changeLanguage(lang)
        setCurrentLanguage(lang)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [i18n])

  const setLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
    setCurrentLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, isLoading, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
} 