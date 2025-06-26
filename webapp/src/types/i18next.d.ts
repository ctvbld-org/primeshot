declare module '*.json' {
  const value: { [key: string]: string | number | boolean | null | { [key: string]: unknown } };
  export default value;
}

import 'i18next';

// Import the JSON files directly to get their types
import type common from '../locales/en/common.json';
import type payment from '../locales/en/payment.json';
import type albums from '../locales/en/albums.json';
import type styles from '../locales/en/styles.json';
import type auth from '../locales/en/auth.json';
import type profile from '../locales/en/profile.json';
import type upload from '../locales/en/upload.json';
import type review from '../locales/en/review.json';
import type settings from '../locales/en/settings.json';

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
    }
  }
} 