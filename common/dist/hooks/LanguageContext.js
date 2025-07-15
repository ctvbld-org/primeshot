'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
const LanguageContext = createContext(undefined);
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        async function init() {
            try {
                setIsLoading(true);
                const saved = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
                const lang = saved || i18n.options.fallbackLng;
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
    };
    return (_jsx(LanguageContext.Provider, { value: { currentLanguage, isLoading, setLanguage }, children: children }));
}
export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx)
        throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
