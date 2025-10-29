'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-client';
/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 */
export function I18nProvider({ children }) {
    return (_jsx(I18nextProvider, { i18n: i18n, children: children }));
}
export default I18nProvider;
