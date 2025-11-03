'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n';
// Client-side i18n initialization - must run unconditionally to ensure consistent hooks behavior
if (!i18n.isInitialized) {
    // Don't use LanguageDetector during initialization to prevent hydration mismatch
    // Language will be set by I18nProvider based on server-detected locale
    i18n
        .use(initReactI18next)
        .init({
        lng: DEFAULT_LANGUAGE, // Start with default, will be synced by I18nProvider
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        interpolation: {
            escapeValue: false,
        },
        defaultNS: 'common',
        ns: ['common', 'auth', 'pricing', 'styles', 'generate', 'inference', 'character', 'about', 'legal', 'upload', 'homepage', 'account'],
        resources,
        // Disable automatic detection to prevent hydration mismatch
        // Language is controlled by I18nProvider prop
        react: {
            useSuspense: false
        }
    });
}
export default i18n;
