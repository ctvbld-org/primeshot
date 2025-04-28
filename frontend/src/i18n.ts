import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import paymentEn from '@/locales/en/payment.json';
import paymentEs from '@/locales/es/payment.json';
import dashboardEn from '@/locales/en/dashboard.json';
import dashboardEs from '@/locales/es/dashboard.json';  
import stylesEn from '@/locales/en/styles.json';
import stylesEs from '@/locales/es/styles.json';
import authEn from '@/locales/en/auth.json';
import authEs from '@/locales/es/auth.json';
import profileEn from '@/locales/en/profile.json';
import profileEs from '@/locales/es/profile.json';
import uploadEn from '@/locales/en/upload.json';
import uploadEs from '@/locales/es/upload.json';

export const resources = {
  en: {
    common: commonEn,
    payment: paymentEn,
    dashboard: dashboardEn,
    styles: stylesEn,
    auth: authEn,
    profile: profileEn,
    upload: uploadEn
  },
  es: {
    common: commonEs,
    payment: paymentEs,
    dashboard: dashboardEs,
    styles: stylesEs,
    auth: authEs,
    profile: profileEs,
    upload: uploadEs
  }
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
    lng: 'es', // Set default language explicitly
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'payment', 'dashboard', 'styles', 'auth', 'profile', 'upload'],
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