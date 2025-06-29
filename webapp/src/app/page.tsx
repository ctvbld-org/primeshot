'use client'

import { useAuth } from '@/contexts/auth-context'
import { StylesCarousel } from '@/components/home/StylesCarousel'
import { FloatingOptionButtons } from '@/components/home/FloatingOptionButtons'
import { GenerationControls } from '@/components/home/GenerationControls'
import { GalleryPlaceholder } from '@/components/home/GalleryPlaceholder'
import { FaceModelSelector } from '@/components/create/face_models'
import Link from 'next/link'
import { Skeleton } from '@primeshot/common/web/ui/skeleton'

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
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Styles carousel */}
      <section className="relative">
        <StylesCarousel />
        {/* Floating buttons anchored on the carousel */}
        <FloatingOptionButtons />
      </section>

      {/* Generation section */}
      <section className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-4 md:space-y-0">
        {/* Left – LoRA selector */}
        <FaceModelSelector className="flex-shrink-0" />

        {/* Right – Generation controls */}
        <GenerationControls />
      </section>

      {/* Gallery or placeholder */}
      <section>
        {isAuthenticated ? (
          <GalleryPlaceholder />
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-md p-12 text-center text-gray-400">
            <p className="mb-4">Please sign in to generate images.</p>
          </div>
        )}
      </section>
    </main>
  )
}
