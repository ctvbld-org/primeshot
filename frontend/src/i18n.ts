import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files

// German
import commonDe from '@/locales/de/common.json';
import paymentDe from '@/locales/de/payment.json';
import albumsDe from '@/locales/de/albums.json'; 
import stylesDe from '@/locales/de/styles.json';
import authDe from '@/locales/de/auth.json';
import profileDe from '@/locales/de/profile.json';
import uploadDe from '@/locales/de/upload.json';
import reviewDe from '@/locales/de/review.json';
import settingsDe from '@/locales/de/settings.json';    

// English
import commonEn from '@/locales/en/common.json';
import paymentEn from '@/locales/en/payment.json';
import albumsEn from '@/locales/en/albums.json'; 
import stylesEn from '@/locales/en/styles.json';
import authEn from '@/locales/en/auth.json';
import profileEn from '@/locales/en/profile.json';
import uploadEn from '@/locales/en/upload.json';
import reviewEn from '@/locales/en/review.json';
import settingsEn from '@/locales/en/settings.json';

// Spanish
import commonEs from '@/locales/es/common.json';
import paymentEs from '@/locales/es/payment.json';
import albumsEs from '@/locales/es/albums.json'; 
import stylesEs from '@/locales/es/styles.json';
import authEs from '@/locales/es/auth.json';
import profileEs from '@/locales/es/profile.json';
import uploadEs from '@/locales/es/upload.json';
import reviewEs from '@/locales/es/review.json';
import settingsEs from '@/locales/es/settings.json';

// French
import commonFr from '@/locales/fr/common.json';
import paymentFr from '@/locales/fr/payment.json';
import albumsFr from '@/locales/fr/albums.json'; 
import stylesFr from '@/locales/fr/styles.json';
import authFr from '@/locales/fr/auth.json';
import profileFr from '@/locales/fr/profile.json';
import uploadFr from '@/locales/fr/upload.json';
import reviewFr from '@/locales/fr/review.json';
import settingsFr from '@/locales/fr/settings.json';

// Italian
import commonIt from '@/locales/it/common.json';
import paymentIt from '@/locales/it/payment.json';
import albumsIt from '@/locales/it/albums.json'; 
import stylesIt from '@/locales/it/styles.json';
import authIt from '@/locales/it/auth.json';
import profileIt from '@/locales/it/profile.json';
import uploadIt from '@/locales/it/upload.json';
import reviewIt from '@/locales/it/review.json';
import settingsIt from '@/locales/it/settings.json';

// Dutch
import commonNl from '@/locales/nl/common.json';
import paymentNl from '@/locales/nl/payment.json';
import albumsNl from '@/locales/nl/albums.json'; 
import stylesNl from '@/locales/nl/styles.json';
import authNl from '@/locales/nl/auth.json';
import profileNl from '@/locales/nl/profile.json';
import uploadNl from '@/locales/nl/upload.json';
import reviewNl from '@/locales/nl/review.json';
import settingsNl from '@/locales/nl/settings.json';

// Portuguese
import commonPt from '@/locales/pt/common.json';
import paymentPt from '@/locales/pt/payment.json';
import albumsPt from '@/locales/pt/albums.json'; 
import stylesPt from '@/locales/pt/styles.json';
import authPt from '@/locales/pt/auth.json';
import profilePt from '@/locales/pt/profile.json';
import uploadPt from '@/locales/pt/upload.json';
import reviewPt from '@/locales/pt/review.json';
import settingsPt from '@/locales/pt/settings.json';

// Japanese
import commonJa from '@/locales/ja/common.json';
import paymentJa from '@/locales/ja/payment.json';
import albumsJa from '@/locales/ja/albums.json'; 
import stylesJa from '@/locales/ja/styles.json';
import authJa from '@/locales/ja/auth.json';
import profileJa from '@/locales/ja/profile.json';
import uploadJa from '@/locales/ja/upload.json';
import reviewJa from '@/locales/ja/review.json';
import settingsJa from '@/locales/ja/settings.json';

// Chinese
import commonZh from '@/locales/zh/common.json';
import paymentZh from '@/locales/zh/payment.json';
import albumsZh from '@/locales/zh/albums.json'; 
import stylesZh from '@/locales/zh/styles.json';
import authZh from '@/locales/zh/auth.json';
import profileZh from '@/locales/zh/profile.json';
import uploadZh from '@/locales/zh/upload.json';
import reviewZh from '@/locales/zh/review.json';
import settingsZh from '@/locales/zh/settings.json';

export const resources = {
    de: {
        common: commonDe,
        payment: paymentDe,
        albums: albumsDe,
        styles: stylesDe,
        auth: authDe,
        profile: profileDe,
        upload: uploadDe,
        review: reviewDe,
        settings: settingsDe
    },
    en: {
        common: commonEn,
        payment: paymentEn,
        albums: albumsEn,
        styles: stylesEn,
        auth: authEn,
        profile: profileEn,
        upload: uploadEn,
        review: reviewEn,
        settings: settingsEn
    },
    es: {
        common: commonEs,
        payment: paymentEs,
        albums: albumsEs,
        styles: stylesEs,
        auth: authEs,
        profile: profileEs,
        upload: uploadEs,
        review: reviewEs,
        settings: settingsEs
    },
    fr: {
        common: commonFr,
        payment: paymentFr,
        albums: albumsFr,
        styles: stylesFr,
        auth: authFr,
        profile: profileFr,
        upload: uploadFr,
        review: reviewFr,
        settings: settingsFr
    },
    it: {
        common: commonIt,
        payment: paymentIt,
        albums: albumsIt,
        styles: stylesIt,
        auth: authIt,
        profile: profileIt,
        upload: uploadIt,
        review: reviewIt,
        settings: settingsIt
    },
    nl: {
        common: commonNl,
        payment: paymentNl,
        albums: albumsNl,
        styles: stylesNl,
        auth: authNl,
        profile: profileNl,
        upload: uploadNl,
        review: reviewNl,
        settings: settingsNl
    },
    pt: {
        common: commonPt,
        payment: paymentPt,
        albums: albumsPt, 
        styles: stylesPt,
        auth: authPt,
        profile: profilePt,
        upload: uploadPt,
        review: reviewPt,
        settings: settingsPt
    },
    ja: {
        common: commonJa,
        payment: paymentJa,
        albums: albumsJa,
        styles: stylesJa,
        auth: authJa,
        profile: profileJa,
        upload: uploadJa,
        review: reviewJa,
        settings: settingsJa
    },
    zh: {
        common: commonZh,
        payment: paymentZh,
        albums: albumsZh,
        styles: stylesZh,
        auth: authZh,
        profile: profileZh,
        upload: uploadZh,
        review: reviewZh,
        settings: settingsZh
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
    lng: 'en', // Set default language explicitly
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'de', 'fr', 'it', 'nl', 'pt', 'ja', 'zh'],
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'payment', 'albums', 'styles', 'auth', 'profile', 'upload', 'review', 'settings'],
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