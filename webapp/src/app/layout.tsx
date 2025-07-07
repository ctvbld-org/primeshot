import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { BannerProvider } from "@primeshot/common/web/ui/use-banner"
import { Header } from '@primeshot/common'
import { AuthProvider } from '@primeshot/common'
import { LanguageProvider } from '@primeshot/common'
import { DialogServiceProvider } from '@/contexts/DialogServiceContext'
import { IntentHandler } from '@/components/providers/intent-handler'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${carb.variable} ${inter.className}`}>
        <AuthProvider>
          <LanguageProvider>
            <QueryProvider>
              <BannerProvider>
                <DialogServiceProvider>
                  <IntentHandler />
                  <Header />
                  {children}
                  <Toaster />
                </DialogServiceProvider>
              </BannerProvider>
            </QueryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
