import React from 'react';
interface I18nServerProviderProps {
    children: React.ReactNode;
    language: string;
}
/**
 * Server-side I18n Provider component
 * Initializes i18n with the language from server-side cookies
 */
export declare function I18nServerProvider({ children, language }: I18nServerProviderProps): import("react/jsx-runtime").JSX.Element;
export default I18nServerProvider;
