'use client'

import { StylesCarousel } from '@/components/style/StylesCarousel'
import { GalleryPlaceholder } from '@/components/home/GalleryPlaceholder'
import { StyleSelectionProvider } from '@/contexts/style-selection-context'

export default function Home() {
  return (
    <main className="p-(--site-padding) overflow-hidden">

      <StyleSelectionProvider>
        <section className="relative">
          <StylesCarousel />
        </section>
      </StyleSelectionProvider>

      <section className="max-w-[1280px] mx-auto">
        <GalleryPlaceholder />
      </section>
    </main>
  )
}
