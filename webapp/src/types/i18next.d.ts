declare module '*.json' {
  const value: { [key: string]: string | number | boolean | null | { [key: string]: unknown } };
  export default value;
}

import 'i18next';

// Import the JSON files directly to get their types
import type common from '../locales/en-GB/common.json';
import type payment from '../locales/en-GB/payment.json';
import type albums from '../locales/en-GB/albums.json';
import type styles from '../locales/en-GB/styles.json';
import type auth from '../locales/en-GB/auth.json';
import type profile from '../locales/en-GB/profile.json';
import type upload from '../locales/en-GB/upload.json';
import type review from '../locales/en-GB/review.json';
import type settings from '../locales/en-GB/settings.json';
import type pricing from '@primeshot/common/locales/en-GB/pricing.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      payment: typeof payment;
      albums: typeof albums;
      styles: typeof styles;
      auth: typeof auth;
      profile: typeof profile;
      upload: typeof upload;
      review: typeof review;
      settings: typeof settings;
      pricing: typeof pricing;
    }
  }
} 