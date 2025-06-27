'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatAuthError } from '@/lib/utils/auth';
const initialState = {
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false
};
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [state, setState] = useState(initialState);
    const supabase = createClient();
    useEffect(() => {
        const updateUserState = async (session) => {
            const newUser = session === null || session === void 0 ? void 0 : session.user;
            if (newUser) {
                const { data: dbUser, error: dbError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', newUser.id)
                    .single();
                if (dbError)
                    console.error('Error fetching user data:', dbError);
                const mergedUser = { ...newUser, ...dbUser };
                setState(prev => {
                    var _a;
                    if (((_a = prev.user) === null || _a === void 0 ? void 0 : _a.id) !== mergedUser.id || prev.isLoading) {
                        return {
                            ...prev,
                            user: mergedUser,
                            isAuthenticated: true,
                            isLoading: false
                        };
                    }
                    return prev;
                });
            }
            else {
                setState(prev => ({
                    ...prev,
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                }));
            }
        };
        // initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateUserState(session).catch(console.error);
        });
        // listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            updateUserState(session).catch(console.error);
        });
        return () => subscription.unsubscribe();
    }, [supabase]);
    // auth actions
    const signIn = async (email) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
            });
            if (error)
                throw error;
            window.location.href = `/auth/verify?email=${encodeURIComponent(email)}`;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const signInWithGoogle = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            });
            if (error)
                throw error;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const signInWithLinkedIn = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'linkedin_oidc',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'openid profile email'
                }
            });
            if (error)
                throw error;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const signOut = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const currentPath = window.location.pathname + window.location.search;
            const isRelative = !currentPath.startsWith('http');
            const safePath = isRelative ? currentPath : '/';
            const returnUrl = encodeURIComponent(safePath);
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
            window.location.href = `/auth/signin?returnUrl=${returnUrl}`;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const clearError = () => setState(prev => ({ ...prev, error: null }));
    const value = {
        ...state,
        signIn,
        signInWithGoogle,
        signInWithLinkedIn,
        signOut,
        clearError
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
