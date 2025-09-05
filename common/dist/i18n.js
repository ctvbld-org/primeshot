import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Import all translation files  
// English
import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
export const resources = {
    en: {
        common: commonEn,
        auth: authEn,
        // Note: Other namespaces (payment, albums, styles, etc.) remain in webapp
        // as they are webapp-specific translations
    },
    // de: {
    //     common: commonDe,
    //     auth: authDe,
    // },
    // es: {
    //     common: commonEs,
    //     auth: authEs,
    // },
    // fr: {
    //     common: commonFr,
    //     auth: authFr,
    // },
    // it: {
    //     common: commonIt,
    //     auth: authIt,
    // },
    // nl: {
    //     common: commonNl,
    //     auth: authNl,
    // },
    // pt: {
    //     common: commonPt,
    //     auth: authPt,
    // },
    // ja: {
    //     common: commonJa,
    //     auth: authJa,
    // },
    // zh: {
    //     common: commonZh,
    //     auth: authZh,
    // }
};
i18n
    // Detect user language
    // Learn more: https://github.com/i18next/i18next-browser-languagedetector
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // Init i18next
    // For all options read: https://www.i18next.com/overview/configuration-options
    .init({
    lng: 'en', // Set default language explicitly
    fallbackLng: 'en',
    supportedLngs: ['en', /*'es', 'de', 'fr', 'it', 'nl', 'pt', 'ja', 'zh'*/],
    interpolation: {
        escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'auth'], // Only include shared namespaces here
    resources,
    detection: {
        // Order of language detection
        order: ['localStorage', 'navigator'],
        // Cache the language selection in localStorage
        caches: ['localStorage'],
        // Only detect languages we support
        lookupFromPathIndex: 0
    }
});
export default i18n;
