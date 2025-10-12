# Language Detection Fix

## Problem
When using private browsing with a French OS, the website still opened the English version instead of detecting the browser's language preference.

**CRITICAL ISSUE**: Even if the website detected French correctly, visiting the webapp first or after would set the language cookie to English, which the website would then respect, causing the language to switch back to English.

## Root Causes
1. **Improper Accept-Language parsing**: The quality values (`q=0.9`) weren't being properly parsed from the header
2. **Cookie precedence issue**: Invalid cookies weren't being filtered out before checking Accept-Language
3. **Incomplete middleware matcher**: The root path `/` might not have been properly caught by the regex
4. **❗ CRITICAL**: Webapp middleware didn't detect language - it only set cookies when locale was in URL, causing it to default to English and override website preferences

## Changes Made

### 1. Website Middleware (`website/src/middleware.ts`)

#### Improved Accept-Language Parsing
```typescript
// Before: Simple split that didn't handle quality values properly
const [tag] = part.split(';')

// After: Proper parsing with quality value handling
const [tag, qValue] = part.split(';')
const quality = qValue ? parseFloat(qValue.replace('q=', '')) : 1.0
languages.sort((a, b) => b.quality - a.quality) // Sort by quality
```

#### Better Cookie Validation
```typescript
// Before: Used cookie value even if invalid
const locale = (mapToSupported(cookieLocale) || headerLocale || 'en')

// After: Validate cookie first, then fallback to Accept-Language
const validCookieLocale = cookieLocale && mapToSupported(cookieLocale)
if (validCookieLocale) {
  locale = validCookieLocale
} else if (headerLocale) {
  locale = headerLocale
} else {
  locale = 'en'
}
```

#### Enhanced Middleware Matcher
```typescript
export const config = {
  matcher: [
    // Match all paths except static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|public|api|images|og-image|.*\\..*|_next).*)',
    // Explicitly match root path
    '/'
  ]
}
```

#### Debug Logging
Added console logging to help diagnose issues:
```typescript
console.log('[Language Detection]', {
  pathname,
  cookieLocale,
  validCookieLocale,
  acceptLanguageHeader,
  headerLocale,
  finalLocale: locale
})
```

### 2. Webapp Middleware (`webapp/src/middleware.ts`) - **CRITICAL FIX**

This was the main issue causing language to reset to English!

#### Added Accept-Language Detection
```typescript
// Before: Only set cookie if locale prefix in URL
if (first && SUPPORTED.includes(first)) {
  response.cookies.set('i18n_lang', first, ...)
}
// No fallback - cookie never set if no prefix!

// After: Detect from Accept-Language if no valid cookie
const validCookieLocale = cookieLocale && mapToSupported(cookieLocale)
if (isLocalePrefixed) {
  response.cookies.set('i18n_lang', first, ...)
} else if (!validCookieLocale) {
  // NEW: Detect from Accept-Language header
  const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
  const detectedLocale = headerLocale || 'en'
  response.cookies.set('i18n_lang', detectedLocale, ...)
}
```

#### Why This Was Critical
- Webapp and website share the same cookie domain
- Webapp was setting cookie to `en` by default (from client-side JS)
- This would override the website's detected language
- Now webapp detects language from browser too, so both apps use the same language

### 3. Common Package (`common/i18n-server.ts`)

#### Improved Server-Side Accept-Language Parsing
```typescript
// Better parsing with proper quality value extraction
const parts = lang.trim().split(';');
const code = parts[0].toLowerCase().trim();
const qPart = parts.find(p => p.trim().startsWith('q='));
const quality = qPart ? parseFloat(qPart.replace('q=', '').trim()) : 1.0;
```

## Testing

### Automated Test
Run the test script to verify parsing logic:
```bash
node test-language-detection.js
```

Expected output: All 14 tests should pass ✅

### Manual Testing - Private Browsing

1. **Open private browsing window** (no cookies from previous sessions)

2. **Check your OS language**:
   - macOS: System Settings → General → Language & Region
   - Should see French as preferred language

3. **Visit the website**:
   ```
   Open: https://your-domain.com
   Expected redirect: https://your-domain.com/fr/
   ```

4. **Verify in browser DevTools**:
   - Open Network tab
   - Look for the first request to `/`
   - Check Response Headers for redirect to `/fr/`

5. **Check server logs** (if deployed):
   Look for console output:
   ```
   [Language Detection] {
     pathname: '/',
     cookieLocale: null,
     validCookieLocale: null,
     acceptLanguageHeader: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
     headerLocale: 'fr',
     finalLocale: 'fr'
   }
   ```

### Manual Testing - Cross-App Cookie Sharing (CRITICAL TEST)

**This tests the main fix!**

1. **Clear all cookies** (important!)
2. **Set browser to French** (or any non-English language)
3. **Test Scenario A: Visit Website First**
   ```
   1. Visit https://your-domain.com
   2. Should redirect to /fr/
   3. Then visit https://your-domain.com/app
   4. Should still be in French ✅
   ```

4. **Test Scenario B: Visit Webapp First**
   ```
   1. Clear cookies again
   2. Visit https://your-domain.com/app directly
   3. Should detect French from browser
   4. Then visit https://your-domain.com
   5. Should redirect to /fr/ ✅
   ```

5. **Verify Cookie**
   - Open DevTools → Application → Cookies
   - Check `i18n_lang` cookie value
   - Should be `fr` (not `en`)

### Manual Testing - Different Languages

Test with browser language override:
1. Chrome: Settings → Languages → Add languages and reorder
2. Firefox: Settings → General → Language → Choose
3. Safari: Follows system language

Test languages:
- 🇫🇷 French: Should redirect to `/fr/`
- 🇩🇪 German: Should redirect to `/de/`
- 🇪🇸 Spanish: Should redirect to `/es/`
- 🇮🇹 Italian: Should redirect to `/it/`
- 🇵🇹 Portuguese: Should redirect to `/pt/`
- 🇳🇱 Dutch: Should redirect to `/nl/`
- 🇨🇳 Chinese: Should redirect to `/cn/`
- 🇯🇵 Japanese: Should redirect to `/jp/`
- 🇬🇧 English: Should redirect to `/en/`

### Testing Priority Order

The system checks languages in this order:
1. **Valid cookie** (`i18n_lang`) - only if it's a supported language
2. **Accept-Language header** - from browser/OS preferences
3. **Default fallback** - English (`en`)

## Deployment Notes

1. **Debug Logging**: The console.log statements in middleware can be removed after confirming everything works in production:
   ```typescript
   // Remove or comment out these lines after testing:
   console.log('[Language Detection]', { ... })
   ```

2. **Vercel/Production**: 
   - Middleware runs on Edge Functions
   - Check deployment logs to see language detection output
   - Use Vercel Analytics to monitor which locales users are being redirected to

3. **Cache Considerations**:
   - Private browsing disables cookies (good for testing)
   - CDN might cache redirects - may need to purge cache after deployment
   - Test on different devices/browsers to ensure consistency

## Troubleshooting

### Issue: Still seeing English
1. Check browser language settings (not just OS)
2. Clear cookies and cache
3. Check server logs for Accept-Language header value
4. Verify middleware is running (check for debug logs)

### Issue: Wrong language detected
1. Check browser's language priority order
2. Verify the Accept-Language header being sent
3. Ensure the language is in the SUPPORTED array

### Issue: No redirect happening
1. Verify middleware matcher is catching the path
2. Check that the path doesn't match any exclusion patterns
3. Confirm middleware is deployed (on Vercel, check Functions tab)

## Files Modified
- ✅ `website/src/middleware.ts` - Website middleware with language detection
- ✅ `webapp/src/middleware.ts` - Webapp middleware with language detection (CRITICAL FIX)
- ✅ `common/i18n-server.ts` - Server-side language detection utilities
- ✅ `test-language-detection.js` - Automated test script (new file)
- ✅ `LANGUAGE_DETECTION_FIX.md` - This documentation (new file)

## Supported Languages
Current supported languages: `en`, `cn`, `es`, `fr`, `pt`, `de`, `jp`, `it`, `nl`

To add more languages:
1. Update `SUPPORTED` array in middleware
2. Update `SUPPORTED_LANGUAGES` in `common/i18n.ts`
3. Add translations in `common/locales/{lang}/`
4. Add mapping in `mapToSupported` function if needed

