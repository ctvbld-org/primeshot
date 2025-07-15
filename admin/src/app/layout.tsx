import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@primeshot/common/hooks/AuthContext'
import { LanguageProvider } from '@primeshot/common/hooks/LanguageContext'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster as SonnerToaster } from 'sonner'
import { AdminHeader } from '@/components/layout/admin-header'
import { Sidebar } from '@/components/layout/sidebar'

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
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <QueryProvider>
              <div className="min-h-screen bg-gray-50">
                <AdminHeader />
                <div className="flex h-[calc(100vh-3.5rem)]">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto p-6">
                    {children}
                  </main>
                </div>
              </div>
              <SonnerToaster richColors position="top-center" />
            </QueryProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}