import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { BannerProvider } from "@primeshot/common/web/ui/use-banner"
import { Header } from '@primeshot/common'
import { CreditsHeaderRight } from '@/components/header/CreditsHeaderRight'
import { AuthProvider } from '@primeshot/common'
import { LanguageProvider } from '@primeshot/common'
import I18nInitializer from '@/components/providers/I18nInitializer'
import { DialogServiceProvider } from '@/contexts/DialogServiceContext'
import { IntentHandler } from '@/components/providers/intent-handler'
import QueryParamCleaner from '@/components/shared/QueryParamCleaner'
import { InferenceQueueProvider } from '@/contexts/inference-queue-context'

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
      <body className={`${carb.variable} ${inter.className} dark`}>
        <AuthProvider>
          <I18nInitializer>
          <LanguageProvider>
            <QueryProvider>
              <BannerProvider>
                <DialogServiceProvider>
                  <InferenceQueueProvider>
                    <IntentHandler />
                    <QueryParamCleaner />
                    <Header rightSlot={<CreditsHeaderRight />} />
                    {children}
                    <Toaster />
                  </InferenceQueueProvider>
                </DialogServiceProvider>
              </BannerProvider>
            </QueryProvider>
          </LanguageProvider>
          </I18nInitializer>
        </AuthProvider>
      </body>
    </html>
  )
}
