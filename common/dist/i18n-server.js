import i18n from 'i18next';
import { resources, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from './i18n';
// Function to get language from Accept-Language header
function getLanguageFromAcceptLanguage(acceptLanguage) {
    if (!acceptLanguage)
        return DEFAULT_LANGUAGE;
    // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en;q=0.8")
    const languages = acceptLanguage
        .split(',')
        .map(lang => {
        const [code, q] = lang.trim().split(';q=');
        return {
            code: code.toLowerCase(),
            quality: q ? parseFloat(q) : 1.0
        };
    })
        .sort((a, b) => b.quality - a.quality);
    // Check each language in order of preference
    for (const { code } of languages) {
        // Check for exact match first (e.g., "fr")
        if (SUPPORTED_LANGUAGES.includes(code)) {
            return code;
        }
        // Check for language part of locale (e.g., "fr" from "fr-FR")
        const langPart = code.split('-')[0];
        if (SUPPORTED_LANGUAGES.includes(langPart)) {
            return langPart;
        }
        // Special mappings
        if (langPart === 'zh') {
            return 'cn'; // Chinese -> cn
        }
        if (langPart === 'ja') {
            return 'jp'; // Japanese -> jp
        }
    }
    return DEFAULT_LANGUAGE;
}
// Function to get language from cookies and Accept-Language header (server-side)
export function getLanguageFromCookies(cookieString, acceptLanguage) {
    // First, try to get language from cookie
    if (cookieString) {
        const match = cookieString.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE_NAME}=([^;]+)`));
        if (match) {
            const lang = decodeURIComponent(match[1]);
            if (SUPPORTED_LANGUAGES.includes(lang)) {
                return lang;
            }
        }
    }
    // If no cookie, try to get from Accept-Language header
    return getLanguageFromAcceptLanguage(acceptLanguage);
}
// Initialize i18n for server-side with specific language
export function initServerI18n(language = DEFAULT_LANGUAGE) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
        language = DEFAULT_LANGUAGE;
    }
    // Create a new i18n instance for server-side
    const serverI18n = i18n.createInstance();
    serverI18n.init({
        lng: language,
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        interpolation: {
            escapeValue: false,
        },
        defaultNS: 'common',
        ns: ['common', 'auth', 'pricing', 'styles', 'generate', 'inference', 'character', 'about', 'legal', 'upload', 'homepage', 'account'],
        resources,
    });
    return serverI18n;
}
export default i18n;
