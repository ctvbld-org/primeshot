'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-client';
/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 * Accepts optional locale to ensure server/client language sync
 */
export function I18nProvider({ children, locale }) {
    // Synchronously set language BEFORE rendering to prevent hydration mismatch
    useMemo(() => {
        if (locale && i18n.language !== locale) {
            // Use changeLanguage synchronously during render to ensure both
            // server and client start with the same language
            i18n.changeLanguage(locale);
        }
    }, [locale]);
    return (_jsx(I18nextProvider, { i18n: i18n, children: children }));
}
export default I18nProvider;
