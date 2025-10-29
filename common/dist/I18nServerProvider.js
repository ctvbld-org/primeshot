'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { I18nextProvider } from 'react-i18next';
import { initServerI18n } from './i18n-server';
/**
 * Server-side I18n Provider component
 * Initializes i18n with the language from server-side cookies
 */
export function I18nServerProvider({ children, language }) {
    const serverI18n = initServerI18n(language);
    return (_jsx(I18nextProvider, { i18n: serverI18n, children: children }));
}
export default I18nServerProvider;
