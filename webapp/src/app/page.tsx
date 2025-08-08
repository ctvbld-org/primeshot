'use client'

import { useAuth } from '@/contexts/auth-context'
import { StylesCarousel } from '@/components/style/StylesCarousel'
import { GalleryPlaceholder } from '@/components/home/GalleryPlaceholder'
import { StyleSelectionProvider } from '@/contexts/style-selection-context'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'
import { CreditDashboard } from '@/components/dashboard/CreditDashboard'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <Skeleton className="w-full h-[300px] rounded-md" />
        <div className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-4 md:space-y-0">
          <Skeleton className="w-56 h-20 rounded-md" />
          <Skeleton className="flex-1 h-20 rounded-md" />
        </div>
        <Skeleton className="w-full min-h-[400px] rounded-md" />
      </main>
    )
  }

  return (
      <main className="p-(--site-padding)">

        <StyleSelectionProvider>
          <section className="relative">
            <StylesCarousel />
          </section>
        </StyleSelectionProvider>

        <section>
          {isAuthenticated ? (
            <>
              <CreditDashboard className="p-6" />
              <GalleryPlaceholder />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-md p-12 text-center text-gray-400">
              <p className="mb-4">Please sign in to generate images.</p>
            </div>
          )}
        </section>
      </main>
  )
}
