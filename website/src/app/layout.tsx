import './globals.css'
import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import { headers, cookies } from 'next/headers'

const SUPPORTED_LOCALES = ['us','gb','cn','es','fr','pt','de','jp','it','nl'] as const;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

// Backward compatibility: normalize legacy formats to country codes
function normalizeLegacyLanguage(lang: string): string {
  const lower = lang.toLowerCase().trim()
  
  // Handle ISO format (en-GB, en-US, fr-FR, etc.)
  if (lower.includes('-')) {
    const [base, region] = lower.split('-')
    if (base === 'en') {
      return (region === 'us' || region === 'usa') ? 'us' : 'gb'
    }
    return base
  }
  
  // Handle legacy 'en' -> 'gb'
  if (lower === 'en') return 'gb'
  
  return lang
}

function parseAcceptLanguage(header: string | null): string | null {
  if (!header) return null
  
  const parts = header.split(',').map(s => s.trim())
  const languages: Array<{ lang: string; quality: number }> = []
  
  for (const part of parts) {
    const [tag, qValue] = part.split(';')
    const quality = qValue ? parseFloat(qValue.replace('q=', '')) : 1.0
    
    if (tag && !isNaN(quality)) {
      languages.push({ lang: tag.trim(), quality })
    }
  }
  
  languages.sort((a, b) => b.quality - a.quality)
  
  for (const { lang } of languages) {
    const normalized = mapToSupported(lang)
    if (normalized) {
      return normalized
    }
  }
  
  return null
}

function mapToSupported(tag: string | undefined | null): typeof SUPPORTED_LOCALES[number] | null {
  if (!tag) return null
  const lower = tag.toLowerCase().trim()
  
  const exact = SUPPORTED_LOCALES.find(l => l.toLowerCase() === lower)
  if (exact) return exact
  
  const base = lower.split('-')[0]
  switch (base) {
    case 'en':
      if (lower.includes('gb') || lower.includes('uk')) return 'gb'
      return 'us'
    case 'zh': return 'cn'
    case 'es': return 'es'
    case 'fr': return 'fr'
    case 'pt': return 'pt'
    case 'de': return 'de'
    case 'ja': return 'jp'
    case 'it': return 'it'
    case 'nl': return 'nl'
    default: return null
  }
}

async function detectLocale(): Promise<string> {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Priority: valid cookie > Accept-Language header > default 'us'
  const cookieLocale = cookieStore.get('i18n_lang')?.value || null
  const normalizedCookie = cookieLocale ? normalizeLegacyLanguage(cookieLocale) : null
  const validCookieLocale = normalizedCookie && mapToSupported(normalizedCookie)
  
  if (validCookieLocale) {
    return validCookieLocale
  }
  
  const acceptLanguageHeader = headersList.get('accept-language')
  const headerLocale = parseAcceptLanguage(acceptLanguageHeader)
  
  if (headerLocale) {
    return headerLocale
  }
  
  return 'us'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await detectLocale()
  
  return (
    <html lang={locale} className={`${carb.variable} bg-[#000000]`}>
      <body className={`${inter.variable} font-sans antialiased bg-[#000000] min-h-screen text-[#FFFFFF70] pt-[56px]`}>
        {children}
      </body>
    </html>
  )
}
