import { User as SupabaseUser } from '@supabase/supabase-js'

export interface User extends SupabaseUser {
  full_name?: string
  avatar_url?: string
  updated_at?: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: AuthError | null
  isAuthenticated: boolean
}

export interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
} 