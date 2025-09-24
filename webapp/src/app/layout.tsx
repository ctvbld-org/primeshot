import { Inter } from 'next/font/google'
import Script from 'next/script'
import { carb } from '@/fonts'
import './globals.css'

import { Analytics } from "@vercel/analytics/next"
import { QueryProvider } from '@/components/providers/query-provider'
import { I18nInitializer } from '@/components/providers/I18nInitializer'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { BannerProvider } from "@primeshot/common/web/ui/use-banner"
import { Header } from '@primeshot/common'
import { Footer } from '@primeshot/common'
import { CreditsHeaderRight } from '@/components/header/CreditsHeaderRight'
import { AuthProvider } from '@primeshot/common'
import { LanguageProvider } from '@primeshot/common'
import { DialogServiceProvider } from '@/contexts/DialogServiceContext'
import { IntentHandler } from '@/components/providers/intent-handler'
import { InferenceQueueProvider } from '@/contexts/inference-queue-context'
import QueryParamCleaner from '@/components/shared/QueryParamCleaner'
import { PurchaseSuccessHandler } from '@/components/providers/PurchaseSuccessHandler'
import { CrispInitializer } from '@/components/providers/CrispInitializer'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

 

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${carb.variable} ${inter.className} dark`}>
        <I18nInitializer>
          <AuthProvider>
            <LanguageProvider>
              <QueryProvider>
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
              </QueryProvider>
            </LanguageProvider>
          </AuthProvider>
        </I18nInitializer>
        <Analytics />
        <CrispInitializer />
      </body>
    </html>
  )
}