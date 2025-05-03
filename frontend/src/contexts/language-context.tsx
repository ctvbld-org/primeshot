'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './auth-context'

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
  const { user } = useAuth()

  useEffect(() => {
    async function loadLanguagePreference() {
      try {
        setIsLoading(true)
        
        // First try to get from localStorage
        const savedLanguage = localStorage.getItem('i18nextLng')
        
        if (user) {
          // If user is logged in, try to get from database
          const supabase = createClient()
          const { data, error } = await supabase
            .rpc('get_language_preference')
          
          if (!error && data) {
            console.log('Loaded language preference from DB:', data)
            setCurrentLanguage(data)
            await i18n.changeLanguage(data)
            localStorage.setItem('i18nextLng', data)
            setIsLoading(false)
            return
          }
        }
        
        // If no user preference in DB or not logged in, use localStorage or default
        const languageToUse = savedLanguage || i18n.options.fallbackLng as string
        console.log('Using language:', languageToUse)
        setCurrentLanguage(languageToUse)
        await i18n.changeLanguage(languageToUse)
        localStorage.setItem('i18nextLng', languageToUse)
      } catch (error) {
        console.error('Error in loadLanguagePreference:', error)
        // Use fallback language on error
        const fallbackLang = i18n.options.fallbackLng as string
        setCurrentLanguage(fallbackLang)
        await i18n.changeLanguage(fallbackLang)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLanguagePreference()
  }, [user, i18n])

  const setLanguage = async (newLanguage: string) => {
    try {
      console.log('Changing language to:', newLanguage)
      setCurrentLanguage(newLanguage)
      await i18n.changeLanguage(newLanguage)
      localStorage.setItem('i18nextLng', newLanguage)

      if (user) {
        console.log('Updating language preference in database...')
        const supabase = createClient()
        const { error } = await supabase
          .rpc('update_language_preference', {
            new_language: newLanguage
          })
        
        if (error) {
          console.error('Error updating language preference:', error)
        } else {
          console.log('Language preference updated successfully')
        }
      }
    } catch (error) {
      console.error('Error in setLanguage:', error)
    }
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, isLoading, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 