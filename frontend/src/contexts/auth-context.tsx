'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthContextType, AuthState, User } from '@/types/auth'
import { formatAuthError } from '@/lib/utils/auth'

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  const supabase = createClient()

  useEffect(() => {
    // Function to update state only if user ID changes
    const updateUserState = (session: any) => {
      const newUser = session?.user as User | null;
      setState(prev => {
        // Only update if the user ID is actually different, or if loading state needs change
        if (prev.user?.id !== newUser?.id || prev.isLoading) {
          return {
            ...prev,
            user: newUser,
            isAuthenticated: !!newUser,
            isLoading: false
          };
        }
        // Otherwise, return previous state to avoid unnecessary re-renders
        return prev;
      });
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserState(session);
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session);
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase]); // Depend on supabase client instance

  const signIn = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      window.location.href = '/auth/verify'
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: formatAuthError(error as Error)
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: formatAuthError(error as Error)
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Save current path before logout to return after login
      const currentPath = window.location.pathname + window.location.search;
      // Ensure the returnUrl is a relative path to prevent open redirect vulnerabilities
      const isRelativePath = !currentPath.startsWith('http://') && !currentPath.startsWith('https://');
      const safeCurrentPath = isRelativePath ? currentPath : '/app/shoot';
      const returnUrl = encodeURIComponent(safeCurrentPath);
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false
      }))

      // Need to use window.location.href for auth redirects since we're changing auth state
      // Router wouldn't work properly as auth state needs a full page load
      window.location.href = `/auth/signin?returnUrl=${returnUrl}`
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: formatAuthError(error as Error)
      }))
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signInWithGoogle,
    signOut,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 