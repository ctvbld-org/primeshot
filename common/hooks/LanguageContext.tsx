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

        // Try to read locale from URL prefix (explicit user intent)
        let urlLocale: string | null = null
        if (typeof window !== 'undefined') {
          // Match both country codes (us, gb, fr) and legacy ISO format (en-GB, fr-FR)
          const match = window.location.pathname.match(/^\/([a-z]{2})(?:-[A-Z]{2})?(?:\/|$)/)
          if (match) {
            const rawLocale = match[1]
            // Normalize if it's legacy 'en' to 'gb'
            urlLocale = rawLocale === 'en' ? 'gb' : rawLocale
          }
        }

        // Check for language from cookie (set by website/middleware)
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

        // Precedence: URL > DB > cookie > localStorage > default
        const lang = urlLocale || dbLang || cookieLocale || localStorage.getItem('i18nextLng') || 'us'
        
        // Only change language if it's different from current
        if (lang !== i18n.language) {
          await i18n.changeLanguage(lang)
          // Keep cookie in sync with URL/selected language
          try {
            const maxAge = 60 * 60 * 24 * 365 // 1 year
            document.cookie = `i18n_lang=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; samesite=lax`
          } catch {}
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
    
    // Validate language is supported, fallback to 'us' if not
    let targetLang = lang
    if (!supportedLangs.includes(lang)) {
      console.warn(`Unsupported language: ${lang}, falling back to 'us'`)
      targetLang = 'us'
      
      // If 'us' is also not supported (edge case), use first available language
      if (!supportedLangs.includes('us') && supportedLangs.length > 0) {
        targetLang = supportedLangs[0]
        console.warn(`'us' not available, using first supported language: ${targetLang}`)
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
          // Strip any existing locale prefix (e.g., /fr/create -> /create, /en-GB/create -> /create)
          // More robust regex to handle edge cases including ISO format
          const cleanPath = currentPath.replace(/^\/([a-z]{2}(-[A-Z]{2})?)(\/|$)/, '/')
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