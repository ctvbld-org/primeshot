'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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

        setState(prev => {
          if (prev.user?.id !== mergedUser.id || prev.isLoading) {
            return {
              ...prev,
              user: mergedUser,
              isAuthenticated: true,
              isLoading: false
            }
          }
          return prev
        })
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
        options: { emailRedirectTo: getCallbackUrl() }
      })
      if (error) throw error
      // Handle basePath for staging environment
      const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/create') ? '/create' : ''
      window.location.href = `${basePath}/auth/verify?email=${encodeURIComponent(email)}`
    } catch (error) {
      setState(prev => ({ ...prev, error: formatAuthError(error as Error) }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Helper to build redirect URL respecting optional base path
  const getCallbackUrl = () => {
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL + '/auth/callback'
    
    return callbackUrl
  }

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

  const value: AuthContextType = {
    ...state,
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
} 