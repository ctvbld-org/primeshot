'use client'

import { Inter } from 'next/font/google'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import './globals.css'
import '@/i18n'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/contexts/language-context'
import { BannerProvider } from "@/components/ui/use-banner"
import { AppHeader } from '@/components/app-header'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider session={session}>
          <AuthProvider>
            <LanguageProvider>
              <QueryProvider>
                <BannerProvider>
                  <AppHeader />
                  {children}
                  <Toaster />
                </BannerProvider>
              </QueryProvider>
            </LanguageProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
