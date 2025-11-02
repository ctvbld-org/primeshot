import React from 'react';
interface I18nProviderProps {
    children: React.ReactNode;
    locale?: string;
}
/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 * Accepts optional locale to ensure server/client language sync
 */
export declare function I18nProvider({ children, locale }: I18nProviderProps): import("react/jsx-runtime").JSX.Element;
export default I18nProvider;
