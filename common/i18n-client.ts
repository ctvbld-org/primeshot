'use client'

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from './i18n';

// Client-side i18n initialization
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      lng: DEFAULT_LANGUAGE, // Force client to start with English
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES as readonly string[],
      interpolation: {
        escapeValue: false,
      },
      defaultNS: 'common',
      ns: ['common', 'auth', 'pricing', 'styles', 'generate', 'inference', 'character', 'about', 'legal', 'upload', 'homepage', 'account'],
      resources,
      detection: {
        order: ['cookie', 'localStorage'],
        caches: ['localStorage', 'cookie'],
        lookupFromPathIndex: 0,
        lookupCookie: LANGUAGE_COOKIE_NAME,
        cookieMinutes: 525600, // 1 year
        cookieDomain: undefined,
        cookieOptions: { path: '/', sameSite: 'lax' }
      }
    });
}

export default i18n;
