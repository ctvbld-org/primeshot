'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createClient } from '../lib/supabase/client';
const LanguageContext = createContext(undefined);
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        async function init() {
            var _a;
            try {
                setIsLoading(true);
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
                await i18n.changeLanguage(lang);
                setCurrentLanguage(lang);
            }
            finally {
                setIsLoading(false);
            }
        }
        init();
    }, [i18n]);
    const setLanguage = async (lang) => {
        await i18n.changeLanguage(lang);
        setCurrentLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('i18nextLng', lang);
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
