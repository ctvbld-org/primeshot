export * as hooks from './hooks';
export * as web from './web';
// Convenience re-exports
export { LanguageProvider, useLanguage } from './hooks/LanguageContext';
export { AuthProvider, useAuth } from './hooks/AuthContext';
export { Header } from './web/Header';
export { Icon } from './web/Icon';
export { Footer } from './web/Footer';
export { AccountDialog } from './web/AccountDialog';
export { SignInModal } from './web/SignInModal';
export { SignInForm } from './web/SignInForm';
export { LanguageSwitcher } from './web/LanguageSwitcher';
// Server-only utilities should be imported directly; do not re-export here to avoid bundling in web builds.
// Global i18n instance and provider
export { default as i18n, resources, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from './i18n';
export { I18nProvider } from './I18nProvider';
export { I18nServerProvider } from './I18nServerProvider';
export { getLanguageFromCookies, initServerI18n } from './i18n-server';
// Stripe
export { STRIPE_REFERENCE } from './lib/stripe/stripe-reference';
export { getStripeEnv } from './lib/stripe/env';
// Pricing utilities
export * from './lib/pricing';
