import i18n from 'i18next';

// Import all translation files from common package
// US English
import commonUs from './locales/us/common.json';
import authUs from './locales/us/auth.json';
import pricingUs from './locales/us/pricing.json';
import stylesUs from './locales/us/styles.json';
import generateUs from './locales/us/generate.json';
import inferenceUs from './locales/us/inference.json';
import characterUs from './locales/us/character.json';
import aboutUs from './locales/us/about.json';
import legalUs from './locales/us/legal.json';
import uploadUs from './locales/us/upload.json';
import homepageUs from './locales/us/homepage.json';
import accountUs from './locales/us/account.json';

// UK English
import commonGb from './locales/gb/common.json';
import authGb from './locales/gb/auth.json';
import pricingGb from './locales/gb/pricing.json';
import stylesGb from './locales/gb/styles.json';
import generateGb from './locales/gb/generate.json';
import inferenceGb from './locales/gb/inference.json';
import characterGb from './locales/gb/character.json';
import aboutGb from './locales/gb/about.json';
import legalGb from './locales/gb/legal.json';
import uploadGb from './locales/gb/upload.json';
import homepageGb from './locales/gb/homepage.json';
import accountGb from './locales/gb/account.json';

// French
import commonFr from './locales/fr/common.json';
import authFr from './locales/fr/auth.json';
import pricingFr from './locales/fr/pricing.json';
import stylesFr from './locales/fr/styles.json';
import generateFr from './locales/fr/generate.json';
import inferenceFr from './locales/fr/inference.json';
import characterFr from './locales/fr/character.json';
import aboutFr from './locales/fr/about.json';
import legalFr from './locales/fr/legal.json';
import uploadFr from './locales/fr/upload.json';
import homepageFr from './locales/fr/homepage.json';
import accountFr from './locales/fr/account.json';

// Spanish
import commonEs from './locales/es/common.json';
import authEs from './locales/es/auth.json';
import pricingEs from './locales/es/pricing.json';
import stylesEs from './locales/es/styles.json';
import generateEs from './locales/es/generate.json';
import inferenceEs from './locales/es/inference.json';
import characterEs from './locales/es/character.json';
import aboutEs from './locales/es/about.json';
import legalEs from './locales/es/legal.json';
import uploadEs from './locales/es/upload.json';
import homepageEs from './locales/es/homepage.json';
import accountEs from './locales/es/account.json';

// Italian
import commonIt from './locales/it/common.json';
import authIt from './locales/it/auth.json';
import pricingIt from './locales/it/pricing.json';
import stylesIt from './locales/it/styles.json';
import generateIt from './locales/it/generate.json';
import inferenceIt from './locales/it/inference.json';
import characterIt from './locales/it/character.json';
import aboutIt from './locales/it/about.json';
import legalIt from './locales/it/legal.json';
import uploadIt from './locales/it/upload.json';
import homepageIt from './locales/it/homepage.json';
import accountIt from './locales/it/account.json';

// Portuguese
import commonPt from './locales/pt/common.json';
import authPt from './locales/pt/auth.json';
import pricingPt from './locales/pt/pricing.json';
import stylesPt from './locales/pt/styles.json';
import generatePt from './locales/pt/generate.json';
import inferencePt from './locales/pt/inference.json';
import characterPt from './locales/pt/character.json';
import aboutPt from './locales/pt/about.json';
import legalPt from './locales/pt/legal.json';
import uploadPt from './locales/pt/upload.json';
import homepagePt from './locales/pt/homepage.json';
import accountPt from './locales/pt/account.json';

// German
import commonDe from './locales/de/common.json';
import authDe from './locales/de/auth.json';
import pricingDe from './locales/de/pricing.json';
import stylesDe from './locales/de/styles.json';
import generateDe from './locales/de/generate.json';
import inferenceDe from './locales/de/inference.json';
import characterDe from './locales/de/character.json';
import aboutDe from './locales/de/about.json';
import legalDe from './locales/de/legal.json';
import uploadDe from './locales/de/upload.json';
import homepageDe from './locales/de/homepage.json';
import accountDe from './locales/de/account.json';

// Dutch
import commonNl from './locales/nl/common.json';
import authNl from './locales/nl/auth.json';
import pricingNl from './locales/nl/pricing.json';
import stylesNl from './locales/nl/styles.json';
import generateNl from './locales/nl/generate.json';
import inferenceNl from './locales/nl/inference.json';
import characterNl from './locales/nl/character.json';
import aboutNl from './locales/nl/about.json';
import legalNl from './locales/nl/legal.json';
import uploadNl from './locales/nl/upload.json';
import homepageNl from './locales/nl/homepage.json';
import accountNl from './locales/nl/account.json';

// Chinese
import commonCn from './locales/cn/common.json';
import authCn from './locales/cn/auth.json';
import pricingCn from './locales/cn/pricing.json';
import stylesCn from './locales/cn/styles.json';
import generateCn from './locales/cn/generate.json';
import inferenceCn from './locales/cn/inference.json';
import characterCn from './locales/cn/character.json';
import aboutCn from './locales/cn/about.json';
import legalCn from './locales/cn/legal.json';
import uploadCn from './locales/cn/upload.json';
import homepageCn from './locales/cn/homepage.json';
import accountCn from './locales/cn/account.json';

// Japanese
import commonJp from './locales/jp/common.json';
import authJp from './locales/jp/auth.json';
import pricingJp from './locales/jp/pricing.json';
import stylesJp from './locales/jp/styles.json';
import generateJp from './locales/jp/generate.json';
import inferenceJp from './locales/jp/inference.json';
import characterJp from './locales/jp/character.json';
import aboutJp from './locales/jp/about.json';
import legalJp from './locales/jp/legal.json';
import uploadJp from './locales/jp/upload.json';
import homepageJp from './locales/jp/homepage.json';
import accountJp from './locales/jp/account.json';

// Global resources with all namespaces
export const resources = {
  us: {
    common: commonUs,
    auth: authUs,
    pricing: pricingUs,
    styles: stylesUs,
    generate: generateUs,
    inference: inferenceUs,
    character: characterUs,
    about: aboutUs,
    legal: legalUs,
    upload: uploadUs,
    homepage: homepageUs,
    account: accountUs,
  },
  gb: {
    common: commonGb,
    auth: authGb,
    pricing: pricingGb,
    styles: stylesGb,
    generate: generateGb,
    inference: inferenceGb,
    character: characterGb,
    about: aboutGb,
    legal: legalGb,
    upload: uploadGb,
    homepage: homepageGb,
    account: accountGb,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    pricing: pricingFr,
    styles: stylesFr,
    generate: generateFr,
    inference: inferenceFr,
    character: characterFr,
    about: aboutFr,
    legal: legalFr,
    upload: uploadFr,
    homepage: homepageFr,
    account: accountFr,
  },
  es: {
    common: commonEs,
    auth: authEs,
    pricing: pricingEs,
    styles: stylesEs,
    generate: generateEs,
    inference: inferenceEs,
    character: characterEs,
    about: aboutEs,
    legal: legalEs,
    upload: uploadEs,
    homepage: homepageEs,
    account: accountEs,
  },
  it: {
    common: commonIt,
    auth: authIt,
    pricing: pricingIt,
    styles: stylesIt,
    generate: generateIt,
    inference: inferenceIt,
    character: characterIt,
    about: aboutIt,
    legal: legalIt,
    upload: uploadIt,
    homepage: homepageIt,
    account: accountIt,
  },
  pt: {
    common: commonPt,
    auth: authPt,
    pricing: pricingPt,
    styles: stylesPt,
    generate: generatePt,
    inference: inferencePt,
    character: characterPt,
    about: aboutPt,
    legal: legalPt,
    upload: uploadPt,
    homepage: homepagePt,
    account: accountPt,
  },
  de: {
    common: commonDe,
    auth: authDe,
    pricing: pricingDe,
    styles: stylesDe,
    generate: generateDe,
    inference: inferenceDe,
    character: characterDe,
    about: aboutDe,
    legal: legalDe,
    upload: uploadDe,
    homepage: homepageDe,
    account: accountDe,
  },
  nl: {
    common: commonNl,
    auth: authNl,
    pricing: pricingNl,
    styles: stylesNl,
    generate: generateNl,
    inference: inferenceNl,
    character: characterNl,
    about: aboutNl,
    legal: legalNl,
    upload: uploadNl,
    homepage: homepageNl,
    account: accountNl,
  },
  cn: {
    common: commonCn,
    auth: authCn,
    pricing: pricingCn,
    styles: stylesCn,
    generate: generateCn,
    inference: inferenceCn,
    character: characterCn,
    about: aboutCn,
    legal: legalCn,
    upload: uploadCn,
    homepage: homepageCn,
    account: accountCn,
  },
  jp: {
    common: commonJp,
    auth: authJp,
    pricing: pricingJp,
    styles: stylesJp,
    generate: generateJp,
    inference: inferenceJp,
    character: characterJp,
    about: aboutJp,
    legal: legalJp,
    upload: uploadJp,
    homepage: homepageJp,
    account: accountJp,
  },
};

export const SUPPORTED_LANGUAGES = ['us', 'gb', 'cn', 'es', 'fr', 'pt', 'de', 'jp', 'it', 'nl'] as const;
export const DEFAULT_LANGUAGE = 'us';
export const LANGUAGE_COOKIE_NAME = 'i18n_lang';

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Server-side: basic initialization without browser-specific features
if (!i18n.isInitialized) {
  i18n.init({
    lng: DEFAULT_LANGUAGE, // Force server to always use US English
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as readonly string[],
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'auth', 'pricing', 'styles', 'generate', 'inference', 'character', 'about', 'legal', 'upload', 'homepage', 'account'],
    resources,
  });
}

export default i18n;