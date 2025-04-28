declare module '*.json' {
  const value: { [key: string]: any };
  export default value;
}

import 'i18next';

// Import the JSON files directly to get their types
import type common from '../locales/en/common.json';
import type payment from '../locales/en/payment.json';
import type dashboard from '../locales/en/dashboard.json';
import type styles from '../locales/en/styles.json';
import type auth from '../locales/en/auth.json';
import type profile from '../locales/en/profile.json';
import type upload from '../locales/en/upload.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      payment: typeof payment;
      dashboard: typeof dashboard;
      styles: typeof styles;
      auth: typeof auth;
      profile: typeof profile;
      upload: typeof upload;
    }
  }
} 