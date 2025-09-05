import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files  

// English
import commonEn from '@primeshot/common/locales/en/common.json';
import paymentEn from '@/locales/en/payment.json';
import albumsEn from '@/locales/en/albums.json'; 
import stylesEn from '@/locales/en/styles.json';
import authEn from '@primeshot/common/locales/en/auth.json';
import profileEn from '@/locales/en/profile.json';
import uploadEn from '@/locales/en/upload.json';
import reviewEn from '@/locales/en/review.json';
import settingsEn from '@/locales/en/settings.json';

export const resources = {
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
    // de: {
    //     common: commonDe,
    //     payment: paymentDe,
    //     albums: albumsDe,
    //     styles: stylesDe,
    //     auth: authDe,
    //     profile: profileDe,
    //     upload: uploadDe,
    //     review: reviewDe,
    //     settings: settingsDe
    // },
    // es: {
    //     common: commonEs,
    //     payment: paymentEs,
    //     albums: albumsEs,
    //     styles: stylesEs,
    //     auth: authEs,
    //     profile: profileEs,
    //     upload: uploadEs,
    //     review: reviewEs,
    //     settings: settingsEs
    // },
    // fr: {
    //     common: commonFr,
    //     payment: paymentFr,
    //     albums: albumsFr,
    //     styles: stylesFr,
    //     auth: authFr,
    //     profile: profileFr,
    //     upload: uploadFr,
    //     review: reviewFr,
    //     settings: settingsFr
    // },
    // it: {
    //     common: commonIt,
    //     payment: paymentIt,
    //     albums: albumsIt,
    //     styles: stylesIt,
    //     auth: authIt,
    //     profile: profileIt,
    //     upload: uploadIt,
    //     review: reviewIt,
    //     settings: settingsIt
    // },
    // nl: {
    //     common: commonNl,
    //     payment: paymentNl,
    //     albums: albumsNl,
    //     styles: stylesNl,
    //     auth: authNl,
    //     profile: profileNl,
    //     upload: uploadNl,
    //     review: reviewNl,
    //     settings: settingsNl
    // },
    // pt: {
    //     common: commonPt,
    //     payment: paymentPt,
    //     albums: albumsPt, 
    //     styles: stylesPt,
    //     auth: authPt,
    //     profile: profilePt,
    //     upload: uploadPt,
    //     review: reviewPt,
    //     settings: settingsPt
    // },
    // ja: {
    //     common: commonJa,
    //     payment: paymentJa,
    //     albums: albumsJa,
    //     styles: stylesJa,
    //     auth: authJa,
    //     profile: profileJa,
    //     upload: uploadJa,
    //     review: reviewJa,
    //     settings: settingsJa
    // },
    // zh: {
    //     common: commonZh,
    //     payment: paymentZh,
    //     albums: albumsZh,
    //     styles: stylesZh,
    //     auth: authZh,
    //     profile: profileZh,
    //     upload: uploadZh,
    //     review: reviewZh,
    //     settings: settingsZh
    // }
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
    supportedLngs: ['en', /*'es', 'de', 'fr', 'it', 'nl', 'pt', 'ja', 'zh'*/],
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