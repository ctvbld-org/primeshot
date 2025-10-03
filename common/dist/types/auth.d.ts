import { User as SupabaseUser } from '@supabase/supabase-js';
export interface User extends SupabaseUser {
    full_name?: string;
    avatar_url?: string;
    updated_at?: string;
    gender?: string;
    admin?: boolean;
}
export type AuthError = {
    code: string;
    message: string;
};
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: AuthError | null;
    isAuthenticated: boolean;
}
export interface AuthContextType extends AuthState {
    signIn: (email: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithLinkedIn: () => Promise<void>;
    signInWithTwitter: () => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
    refreshUser: () => Promise<void>;
}
