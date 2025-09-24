'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '../lib/supabase/client'
// Note: i18n is initialized by the consuming application

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

        // Try load from DB first (if authenticated)
        let dbLang: string | null = null
        try {
          const supabase = createClient()
          const { data } = await supabase.rpc('get_user_language')
          dbLang = (data as string | null) ?? null
        } catch {}

        const lang = dbLang || saved || (i18n.options.fallbackLng as string)
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

    // Persist to DB if authenticated
    try {
      const supabase = createClient()
      await supabase.rpc('set_user_language', { new_language: lang })
    } catch {}
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