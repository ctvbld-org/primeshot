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
    // Remove basePath if present
    const withoutBase = path.replace(/^\/create(\/|$)/, '/$1')
    const match = withoutBase.match(/^\/(\w{2})(?:\/|$)/)
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

      // Compute new absolute URL compatible with website rewrites
      if (typeof window !== 'undefined') {
        const path = window.location.pathname || '/'
        // Match "/:locale/create(/rest)?" (staging/prod) or "/:locale(/rest)?" (local)
        const m = path.match(/^\/(\w{2})(?:\/create)?(\/.*)?$/)
        const rest = (m && m[2]) ? m[2] : ''
        const target = `/${lang}/create${rest || ''}`
        window.location.assign(target)
        return
      }
      // SSR fallback (should not be hit in client component)
      router.replace(`/${lang}/create`)
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