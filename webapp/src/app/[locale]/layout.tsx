import { cookies } from 'next/headers'
import { ReactNode } from 'react'

const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'it', 'pt', 'de', 'nl', 'cn', 'jp']

interface LocaleLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Validate that the locale is supported
  if (!SUPPORTED_LOCALES.includes(params.locale)) {
    return <>{children}</>
  }

  // Set the locale cookie for the LanguageContext to pick up
  const cookieStore = await cookies()
  cookieStore.set('i18n_lang', params.locale, { 
    path: '/', 
    maxAge: 60 * 60 * 24 * 365, 
    sameSite: 'lax' 
  })

  return <>{children}</>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }))
}
