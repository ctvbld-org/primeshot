import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'
import { cookies, headers } from 'next/headers'

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics } from '@next/third-parties/google'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { BannerProvider } from "@primeshot/common/web/ui/use-banner"
import { Header } from '@primeshot/common'
import { Footer } from '@primeshot/common'
import { CreditsHeaderRight } from '@/components/header/CreditsHeaderRight'
import { AuthProvider, LanguageProvider, I18nServerProvider, getLanguageFromCookies } from '@primeshot/common'
import { DialogServiceProvider } from '@/contexts/DialogServiceContext'
import { IntentHandler } from '@/components/providers/intent-handler'
import { InferenceQueueProvider } from '@/contexts/inference-queue-context'
import { StyleDataProvider } from '@/contexts/style-data-context'
import QueryParamCleaner from '@/components/shared/QueryParamCleaner'
import { PurchaseSuccessHandler } from '@/components/providers/PurchaseSuccessHandler'
import { CrispInitializer } from '@/components/providers/CrispInitializer'
import { getWebsiteCdnUrl } from '@/lib/utils/cdn'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Get base URL for metadata
function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primeshot.ai/create";
  return baseUrl;
}

export const metadata: Metadata = {
  title: "Primeshot - Create Your AI Headshots",
  description: "Transform your selfies into professional AI headshots. Upload your photos, choose your style, and get stunning studio-quality results in minutes.",
  keywords: ["AI headshots", "professional portraits", "AI photography", "headshot generator", "professional image", "AI portraits", "business headshots", "create headshots"],
  authors: [{ name: "Primeshot" }],
  creator: "Primeshot",
  publisher: "Primeshot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(getBaseUrl()),
  icons: {
    icon: [
      { url: getWebsiteCdnUrl('favicon.ico') },
      { url: getWebsiteCdnUrl('favicon.svg'), type: 'image/svg+xml' },
      { url: getWebsiteCdnUrl('favicon-96x96.png'), sizes: '96x96', type: 'image/png' }
    ],
    apple: [
      { url: getWebsiteCdnUrl('apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: getWebsiteCdnUrl('site.webmanifest'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getBaseUrl(),
    title: "Primeshot - Create Your AI Headshots",
    description: "Transform your selfies into professional AI headshots. Upload your photos, choose your style, and get stunning studio-quality results in minutes.",
    siteName: "Primeshot",
    images: [
      {
        url: getWebsiteCdnUrl('og-image.webp'),
        width: 1200,
        height: 630,
        alt: "Primeshot - AI Headshots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Primeshot - Create Your AI Headshots",
    description: "Transform your selfies into professional AI headshots. Upload your photos, choose your style, and get stunning studio-quality results in minutes.",
    creator: "@primeshotai",
    images: [getWebsiteCdnUrl('og-image.webp')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Get language from server-side cookies and Accept-Language header
  const cookieStore = await cookies()
  const headersList = await headers()
  const cookieString = cookieStore.toString()
  const acceptLanguage = headersList.get('accept-language') || undefined
  const serverLanguage = getLanguageFromCookies(cookieString, acceptLanguage)
  return (
    <html lang={serverLanguage} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0c1013" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
        <meta name="apple-mobile-web-app-title" content="Primeshot" />
        <link rel="icon" href={getWebsiteCdnUrl('favicon.ico')} />
        <link rel="icon" type="image/svg+xml" href={getWebsiteCdnUrl('favicon.svg')} />
        <link rel="icon" type="image/png" sizes="96x96" href={getWebsiteCdnUrl('favicon-96x96.png')} />
        <link rel="apple-touch-icon" href={getWebsiteCdnUrl('apple-touch-icon.png')} />
        <link rel="apple-touch-icon" sizes="180x180" href={getWebsiteCdnUrl('apple-touch-icon.png')} />
      </head>
      <body className={`${carb.variable} ${inter.className} dark`}>
        <I18nServerProvider language={serverLanguage}>
          <AuthProvider>
            <LanguageProvider>
              <QueryProvider>
                <StyleDataProvider>
                  <BannerProvider>
                    <InferenceQueueProvider>
                      <DialogServiceProvider>
                        <IntentHandler />
                        <PurchaseSuccessHandler />
                        <QueryParamCleaner />
                        <Header rightSlot={<CreditsHeaderRight />} />
                        {children}
                        <Footer />
                        <Toaster />
                      </DialogServiceProvider>
                    </InferenceQueueProvider>
                  </BannerProvider>
                </StyleDataProvider>
              </QueryProvider>
            </LanguageProvider>
          </AuthProvider>
        </I18nServerProvider>
        <SpeedInsights />
        <GoogleAnalytics gaId="G-MHV2EKTQZG" />
        <Analytics />
        <CrispInitializer />
      </body>
    </html>
  )
}