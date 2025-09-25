import { Inter } from 'next/font/google'
import { carb } from '@/fonts'
import './globals.css'

import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@primeshot/common/web/ui/toaster"
import { AdminHeader } from '@/components/layout/AdminHeader'
import { AuthProvider } from '@primeshot/common'
import { AdminGuard } from '@/components/providers/AdminGuard'
import { RealtimeAnalyticsProvider } from '@/contexts/RealtimeAnalyticsContext'
import { SyncButton } from '@/components/sync/sync-button'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Primeshot Admin',
  description: 'Admin portal for managing Primeshot',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${carb.variable} ${inter.className} dark`}>
        <AuthProvider>
          <QueryProvider>
            <RealtimeAnalyticsProvider>
              <AdminHeader />
              <AdminGuard>
                <main className="flex flex-col min-h-screen w-full mx-auto space-y-6" style={{ paddingTop: 'calc(56px + var(--admin-banner-height, 0px))' }}>
                  <div className="flex-1 overflow-y-auto px-6">
                    {children}
                  </div>
                </main>
              </AdminGuard>

              <Toaster />
              <SyncButton />
          </RealtimeAnalyticsProvider>
        </QueryProvider>
      </AuthProvider>
      </body>
    </html>
  )
}
