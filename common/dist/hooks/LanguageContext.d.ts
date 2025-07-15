import React from 'react';
import '@/i18n';
interface LanguageContextType {
    currentLanguage: string | null;
    isLoading: boolean;
    setLanguage: (lang: string) => Promise<void>;
}
export declare function LanguageProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useLanguage(): LanguageContextType;
export {};
