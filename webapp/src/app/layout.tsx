'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import '@/i18n'

import { AuthProvider } from '@primeshot/common'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { web as commonWeb } from '@primeshot/common'
import { BannerProvider } from "@primeshot/common/web/ui/use-banner"
const { Header } = commonWeb;
import { LanguageProvider } from '@primeshot/common'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <QueryProvider>
              <BannerProvider>
                <Header />
                {children}
                <Toaster />
              </BannerProvider>
            </QueryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
