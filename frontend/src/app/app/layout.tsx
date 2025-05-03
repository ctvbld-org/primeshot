'use client'

import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { Loader } from "@/components/ui/loader"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading your workspace..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  return (
    <div className="flex flex-col flex-1 justify-center pt-[56px] pb-[64px] min-h-screen overflow-hidden" style={{ backgroundColor: '#001514' }}>
      {!pathname.includes('/settings/profile') && (
        <AppHeader user={user} />
      )}
      <main className="h-full pt-0">
        {children}
      </main>
      <Toaster />
    </div>
  )
} 