'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createClient } from '../lib/supabase/client';
const LanguageContext = createContext(undefined);
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);
    // Track hydration to prevent SSR mismatches
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        async function init() {
            var _a;
            try {
                setIsLoading(true);
                // Don't change language during initial hydration to prevent mismatches
                if (!isHydrated) {
                    setCurrentLanguage(i18n.language);
                    return;
                }
                const saved = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
                // Try load from DB first (if authenticated)
                let dbLang = null;
                try {
                    const supabase = createClient();
                    const { data } = await supabase.rpc('get_user_language');
                    dbLang = (_a = data) !== null && _a !== void 0 ? _a : null;
                }
                catch { }
                const lang = dbLang || saved || i18n.options.fallbackLng;
                // Only change language if it's different from current
                if (lang !== i18n.language) {
                    await i18n.changeLanguage(lang);
                }
                setCurrentLanguage(lang);
            }
            finally {
                setIsLoading(false);
            }
        }
        init();
    }, [i18n, isHydrated]);
    const setLanguage = async (lang) => {
        await i18n.changeLanguage(lang);
        setCurrentLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lang);
            try {
                const maxAge = 60 * 60 * 24 * 365; // 1 year
                document.cookie = `i18n_lang=${encodeURIComponent(lang)}; path=/; max-age=${maxAge}; samesite=lax`;
            }
            catch { }
        }
        // Persist to DB if authenticated
        try {
            const supabase = createClient();
            await supabase.rpc('set_user_language', { new_language: lang });
        }
        catch { }
    };
    return (_jsx(LanguageContext.Provider, { value: { currentLanguage, isLoading, setLanguage }, children: children }));
}
export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx)
        throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
