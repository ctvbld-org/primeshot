'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import i18n from '../i18n-client'
// Note: Uses the same i18n instance as I18nProvider

interface LanguageContextType {
  currentLanguage: string | null
  isLoading: boolean
  setLanguage: (lang: string) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation() as any
  const router = useRouter()
  const pathname = usePathname()

  const getLocaleFromPathname = (path: string | null): string | null => {
    if (!path) return null
    // For staging/prod: path will be like "/create" but locale comes from cookie set by website
    // For local dev: path will be like "/en" or "/fr" 
    if (typeof window !== 'undefined') {
      // Check cookie first (set by website middleware on staging/prod)
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('i18n_lang='))
        ?.split('=')[1]
      if (cookieLocale && ['en','fr','es','it','pt','de','nl','cn','jp'].includes(cookieLocale)) {
        return cookieLocale
      }
    }
    // Fallback: extract from URL (local dev)
    const match = path.match(/^\/(\w{2})(?:\/|$)/)
    return match ? match[1] : null
  }

  const initialLocale = getLocaleFromPathname(pathname) || i18n.language || null
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(initialLocale)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // Track hydration to prevent SSR mismatches
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true)
        
        // Don't change language during initial hydration to prevent mismatches
        if (!isHydrated) {
          setCurrentLanguage(getLocaleFromPathname(pathname) || i18n.language)
          return
        }

        const pathLocale = getLocaleFromPathname(pathname)
        if (pathLocale && pathLocale !== i18n.language) {
          await i18n.changeLanguage(pathLocale)
        }
        setCurrentLanguage(pathLocale || i18n.language)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [i18n, isHydrated, pathname])

  const setLanguage = async (lang: string) => {
    setIsLoading(true)
    try {
      // Change the language in i18n
      await i18n.changeLanguage(lang)
      setCurrentLanguage(lang)
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', lang)
        try {
          const maxAge = 60 * 60 * 24 * 365 // 1 year
          document.cookie = `i18n_lang=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; samesite=lax`
        } catch {}
      }

      // Persist to DB if authenticated
      try {
        const supabase = createClient()
        await supabase.rpc('set_user_language', { new_language: lang })
      } catch {}

      // Simple approach: just reload the page, let the website handle routing via cookie
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } finally {
      setIsLoading(false)
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