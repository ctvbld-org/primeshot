import React from 'react';
interface I18nProviderProps {
    children: React.ReactNode;
}
/**
 * Global I18n Provider component
 * Provides the centralized i18n instance to all child components
 */
export declare function I18nProvider({ children }: I18nProviderProps): import("react/jsx-runtime").JSX.Element;
export default I18nProvider;
