'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { formatAuthError } from '../lib/utils/auth';
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
                options: {
                    emailRedirectTo: getCallbackUrl(),
                    shouldCreateUser: true
                }
            });
            if (error)
                throw error;
            // Handle language prefix and basePath for proper redirect
            let redirectPath = '/auth/verify';
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                // Extract language prefix (e.g., /fr/, /en/, etc.)
                const langMatch = currentPath.match(/^\/([a-z]{2})\//);
                const langPrefix = langMatch ? `/${langMatch[1]}` : '';
                // Extract basePath (e.g., /create)
                const basePath = currentPath.startsWith('/create') || currentPath.includes('/create') ? '/create' : '';
                redirectPath = `${langPrefix}${basePath}/auth/verify`;
            }
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
            window.location.href = `${baseUrl}${redirectPath}?email=${encodeURIComponent(email)}`;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    // Helper to build redirect URL respecting optional base path
    const getCallbackUrl = () => {
        const callbackUrl = process.env.NEXT_PUBLIC_APP_URL + '/auth/callback';
        return callbackUrl;
    };
    const signInWithGoogle = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: getCallbackUrl(),
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
                    redirectTo: getCallbackUrl(),
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
    const signInWithAzure = async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                    redirectTo: getCallbackUrl(),
                    scopes: 'email profile openid User.Read',
                    queryParams: { prompt: 'consent' }
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
            const DEFAULT_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/';
            const safePath = isRelative ? currentPath : DEFAULT_PATH;
            const returnUrl = encodeURIComponent(safePath);
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
            window.location.href = DEFAULT_PATH;
        }
        catch (error) {
            setState(prev => ({ ...prev, error: formatAuthError(error) }));
        }
        finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };
    const clearError = () => setState(prev => ({ ...prev, error: null }));
    const refreshUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const current = session === null || session === void 0 ? void 0 : session.user;
            if (!current)
                return;
            const { data: dbUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', current.id)
                .single();
            const mergedUser = { ...current, ...dbUser };
            setState(prev => ({ ...prev, user: mergedUser }));
        }
        catch (e) {
            console.error('Failed to refresh user', e);
        }
    };
    const value = {
        ...state,
        signIn,
        signInWithGoogle,
        signInWithLinkedIn,
        signInWithAzure,
        signOut,
        clearError,
        refreshUser
    };
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
