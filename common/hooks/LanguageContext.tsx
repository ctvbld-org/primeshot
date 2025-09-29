'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(i18n.language || null)
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
          setCurrentLanguage(i18n.language)
          return
        }

        // Check for language from cookie (set by website)
        let cookieLocale: string | null = null
        if (typeof window !== 'undefined') {
          cookieLocale = document.cookie
            .split('; ')
            .find(row => row.startsWith('i18n_lang='))
            ?.split('=')[1] || null
        }

        // Try load from DB first (if authenticated)
        let dbLang: string | null = null
        try {
          const supabase = createClient()
          const { data } = await supabase.rpc('get_user_language')
          dbLang = (data as string | null) ?? null
        } catch {}

        const lang = dbLang || cookieLocale || localStorage.getItem('i18nextLng') || 'en'
        
        // Only change language if it's different from current
        if (lang !== i18n.language) {
          await i18n.changeLanguage(lang)
        }
        setCurrentLanguage(lang)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [i18n, isHydrated])

  const setLanguage = async (lang: string) => {
    // Get supported languages from i18n configuration
    const supportedLangs = (i18n.options.supportedLngs || []).filter((lng: string) => lng !== 'cimode')
    
    // Validate language is supported, fallback to 'en' if not
    let targetLang = lang
    if (!supportedLangs.includes(lang)) {
      console.warn(`Unsupported language: ${lang}, falling back to 'en'`)
      targetLang = 'en'
      
      // If 'en' is also not supported (edge case), use first available language
      if (!supportedLangs.includes('en') && supportedLangs.length > 0) {
        targetLang = supportedLangs[0]
        console.warn(`'en' not available, using first supported language: ${targetLang}`)
      }
    }

    setIsLoading(true)
    try {
      // Change the language in i18n
      await i18n.changeLanguage(targetLang)
      setCurrentLanguage(targetLang)
      
      // Update localStorage with error handling
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('i18nextLng', targetLang)
        } catch (e) {
          console.warn('Failed to save language to localStorage:', e)
        }
        
        // Set cookie with proper error handling
        try {
          const maxAge = 60 * 60 * 24 * 365 // 1 year
          document.cookie = `i18n_lang=${encodeURIComponent(targetLang)}; path=/; max-age=${maxAge}; samesite=lax`
        } catch (e) {
          console.warn('Failed to set language cookie:', e)
        }
      }

      // Persist to DB if authenticated (non-blocking)
      try {
        const supabase = createClient()
        await supabase.rpc('set_user_language', { new_language: targetLang })
      } catch (e) {
        console.warn('Failed to save language to database:', e)
      }

      // Navigate to current page without locale prefix, let website handle locale routing via cookie
      if (typeof window !== 'undefined') {
        try {
          const currentPath = window.location.pathname
          // Strip any existing locale prefix (e.g., /fr/create -> /create)
          // More robust regex to handle edge cases
          const cleanPath = currentPath.replace(/^\/[a-z]{2}(-[A-Z]{2})?(\/|$)/, '/')
          const targetPath = cleanPath || '/'
          
          // Use assign for better browser compatibility
          window.location.assign(targetPath)
        } catch (e) {
          console.warn('Failed to navigate after language change:', e)
          // Fallback: just reload the page
          window.location.reload()
        }
      }
    } catch (e) {
      console.error('Failed to change language:', e)
      // Reset loading state even on error
      setIsLoading(false)
    } finally {
      // Note: setIsLoading(false) is handled in the navigation success
      // or in the catch block for errors before navigation
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