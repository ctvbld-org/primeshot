'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import type { AuthContextType, AuthState, User } from '../types/auth'
import { formatAuthError } from '../lib/utils/auth'

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getAuthBaseUrl() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://primeshot.ai/create').replace(/\/$/, '')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  if (typeof window === 'undefined') {
    return appUrl
  }

  const origin = window.location.origin

  // Apps with a basePath (admin `/admin`, webapp `/create`) must return here.
  if (basePath) {
    return `${origin}${basePath}`
  }

  try {
    if (new URL(appUrl).origin === origin) {
      return appUrl
    }
  } catch {
    // ignore invalid NEXT_PUBLIC_APP_URL
  }

  return origin
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState)
  const supabase = createClient()

  useEffect(() => {
    const updateUserState = async (session: any) => {
      const newUser = session?.user as User | null

      if (newUser) {
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', newUser.id)
          .single()

        if (dbError) console.error('Error fetching user data:', dbError)

        const mergedUser = { ...newUser, ...dbUser }

        // Always apply the DB profile. Skipping when the id already matched
        // left a session user without `admin` if getSession and
        // onAuthStateChange raced (website showed Admin, /admin did not).
        setState(prev => ({
          ...prev,
          user: mergedUser,
          isAuthenticated: true,
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false
        }))
      }
    }

    // initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserState(session).catch(console.error)
    })

    // listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session).catch(console.error)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // auth actions
  const signIn = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { 
          emailRedirectTo: getCallbackUrl(),
          shouldCreateUser: true 
        }
      })
      if (error) throw error
      window.location.href = `${getAuthBaseUrl()}/auth/verify?email=${encodeURIComponent(email)}`
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getCallbackUrl = () => `${getAuthBaseUrl()}/auth/callback`

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getCallbackUrl(),
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signInWithLinkedIn = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: getCallbackUrl(),
          scopes: 'openid profile email'
        }
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signInWithTwitter = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: getCallbackUrl(),
        }
      })
      if (error) throw error
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const currentPath = window.location.pathname + window.location.search
      const isRelative = !currentPath.startsWith('http')
      const DEFAULT_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/'
      const safePath = isRelative ? currentPath : DEFAULT_PATH
      const returnUrl = encodeURIComponent(safePath)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState(prev => ({ ...prev, user: null, isAuthenticated: false }))
      window.location.href = DEFAULT_PATH
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const clearError = () => setState(prev => ({ ...prev, error: null }))

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const current = session?.user as User | null
      if (!current) return
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', current.id)
        .single()
      const mergedUser = { ...current, ...dbUser }
      setState(prev => ({ ...prev, user: mergedUser, isAuthenticated: true }))
    } catch (e) {
      console.error('Failed to refresh user', e)
    }
  }, [supabase])

  const value: AuthContextType = {
    ...state,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithTwitter,
    signOut,
    clearError,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
} 