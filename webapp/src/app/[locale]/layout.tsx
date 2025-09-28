import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'it', 'pt', 'de', 'nl', 'cn', 'jp']

interface LocaleLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default function LocaleLayout({ children, params }: LocaleLayoutProps) {
  // Validate that the locale is supported
  if (!SUPPORTED_LOCALES.includes(params.locale)) {
    notFound()
  }

  return <>{children}</>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
  }))
}
