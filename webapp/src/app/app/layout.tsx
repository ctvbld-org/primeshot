'use client'

import { Toaster } from '@primeshot/common/web/ui/toaster'
import { useAuth, Header } from '@primeshot/common'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Loader } from "@primeshot/common/web/ui/loader"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract the page name from the pathname
  const pageName = pathname.split('/').pop() || 'root'

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/signin')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  return (
    <div className={`flex flex-col flex-1 justify-center pt-[56px] pb-[72px] min-h-screen overflow-hidden page-${pageName}`}>
      {!pathname.includes('/settings/profile') && (
        <Header logoSrc="/create/logo-primeshot.svg" />
      )}
      <main className="h-full pt-0">
        {children}
      </main>
      <Toaster />
    </div>
  )
} 