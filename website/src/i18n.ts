import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files 

// English
import commonEn from '@primeshot/common/locales/en/common.json';
import authEn from '@primeshot/common/locales/en/auth.json';

export const resources = {
    en: {
        common: commonEn,
        auth: authEn
    },
} as const;

i18n
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: 'en', // Set default language explicitly
    fallbackLng: 'en',
    supportedLngs: ['en'],
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'auth'],
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