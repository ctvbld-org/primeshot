'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { StickyShowcaseSection } from '../StickyShowcaseSection'
import { useScrollSection } from '../ScrollSectionManager'
import cssStyles from '../ShowcaseSection.module.css'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'

const cloudfrontLoader = makeCloudfrontLoader('app-images')

interface Style {
  id: string
  name: string
  preview_images: string[]
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function StylesShowcase() {
  const [styles, setStyles] = useState<Style[]>([])
  const [randomImages, setRandomImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { selectedStyleId } = useScrollSection()

  useEffect(() => {
    // Fetch styles from API
    fetch('/api/styles')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch styles')
        return res.json()
      })
      .then((data: Style[]) => {
        setStyles(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching styles:', error)
        setError(error.message)
        setIsLoading(false)
      })
  }, [])

  // Update images when selected style changes or on initial load
  useEffect(() => {
    if (styles.length === 0) return

    // Get random images from styles
    const allImages: string[] = []
    
    if (selectedStyleId) {
      // Filter to show only images from the selected style
      const selectedStyle = styles.find(s => s.id === selectedStyleId)
      if (selectedStyle && selectedStyle.preview_images && Array.isArray(selectedStyle.preview_images)) {
        const imagesWithPath = selectedStyle.preview_images.map(img => 
          img.startsWith('placeholders/') ? img : `placeholders/styles/${img}`
        )
        allImages.push(...imagesWithPath)
      }
    } else {
      // Show random images from all styles
      styles.forEach((style) => {
        if (style.preview_images && Array.isArray(style.preview_images)) {
          // Add full path for app-images structure
          const imagesWithPath = style.preview_images.map(img => 
            img.startsWith('placeholders/') ? img : `placeholders/styles/${img}`
          )
          allImages.push(...imagesWithPath)
        }
      })
    }
    
    // Shuffle and select 4 random images
    const shuffled = shuffleArray(allImages)
    const newImages = shuffled.slice(0, 4)
    
    // Only update if we have enough images (don't show partial set)
    if (newImages.length >= 4) {
      setRandomImages(newImages)
    }
  }, [styles, selectedStyleId])

  // Parallax scroll effect
  useEffect(() => {
    let rafId: number | null = null
    let isInView = false

    const handleScroll = () => {
      if (!sectionRef.current || !isInView) return

      rafId = requestAnimationFrame(() => {
        if (!sectionRef.current) return

        const rect = sectionRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const sectionHeight = rect.height

        // Progress calculation:
        // 0 when section bottom enters viewport bottom (rect.top = viewportHeight)
        // 1 when section top exits viewport top (rect.top = -sectionHeight)
        const progress = Math.max(0, Math.min(1, 
          (viewportHeight - rect.top) / (viewportHeight + sectionHeight)
        ))

        setScrollProgress(progress)
        
        // Mark as scrolled after first movement to disable CSS transitions
        if (progress > 0 && !hasScrolled) {
          setHasScrolled(true)
        }
      })
    }

    // IntersectionObserver to only track when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInView = entry.isIntersecting
          if (isInView) {
            handleScroll()
          } else {
            // Reset to 0 when not in view
            setScrollProgress(0)
          }
        })
      },
      { threshold: 0, rootMargin: '200px' }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [hasScrolled])

  // Calculate parallax transforms for each image
  const getParallaxStyle = (index: number): React.CSSProperties => {
    // Different speeds and directions for depth effect
    const parallaxSpeeds = [
      -200, // Image 0: Move up slowly
      -50, // Image 1: Move up faster
      200,  // Image 2: Move down slowly
      50   // Image 3: Move down faster
    ]

    const translateY = scrollProgress * parallaxSpeeds[index]

    return {
      transform: `translateY(${translateY}px)`,
      // Disable CSS transitions during scroll to prevent conflicts
      transition: hasScrolled ? 'none' : undefined,
      willChange: 'transform'
    }
  }

  const scrollingImages = !isLoading && randomImages.length >= 4 ? (
    <div className={cssStyles.fixedImagesContainer}>
      {/* Image 0 - Bottom Left */}
      <div className="absolute left-[2%] bottom-0" style={getParallaxStyle(0)}>
        <div className={`relative w-[300px] h-[450px] md:w-[300px] md:h-[450px]`}>
          <Image
            src={randomImages[0]}
            alt="Style preview"
            fill
            className="object-cover"
            loader={cloudfrontLoader}
          />
        </div>
      </div>

      {/* Image 1 - Top Left */}
      <div className="absolute left-[15%] bottom-[400px]" style={getParallaxStyle(1)}>
        <div className={`relative w-[200px] h-[300px] md:w-[200px] md:h-[300px]`}>
          <Image
            src={randomImages[1]}
            alt="Style preview"
            fill
            className="object-cover"
            loader={cloudfrontLoader}
          />
        </div>
      </div>

      {/* Image 2 - Top Right */}
      <div className="absolute right-[2%] top-[200px]" style={getParallaxStyle(2)}>
        <div className={`relative w-[300px] h-[450px] md:w-[300px] md:h-[450px]`}>
          <Image
            src={randomImages[2]}
            alt="Style preview"
            fill
            className="object-cover"
            loader={cloudfrontLoader}
          />
        </div>
      </div>

      {/* Image 3 - Bottom Right */}
      <div className="absolute right-[15%] top-[600px]" style={getParallaxStyle(3)}>
        <div className={`relative w-[200px] h-[300px] md:w-[200px] md:h-[300px]`}>
          <Image
            src={randomImages[3]}
            alt="Style preview"
            fill
            className="object-cover"
            loader={cloudfrontLoader}
          />
        </div>
      </div>
    </div>
  ) : null

  return (
    <div ref={sectionRef}>
      <StickyShowcaseSection 
        className={`${cssStyles.container} ${cssStyles.stylesContainer}`}
        panelId="styles"
        scrollingContent={scrollingImages}
      >
        {/* Section Title - FIXED at viewport middle */}
        <div className={cssStyles.content}>
          <div className={cssStyles.titleContainer}>
            <div className={cssStyles.iconWrapper}>
              <Icon variant="styles" size={48} className="text-glacier" />
            </div>
            <h2 className={cssStyles.title}>Photo styles</h2>
          </div>
          <p className={cssStyles.subtitle}>
            From professional portraits to artistic interpretations, select from dozens of
            curated styles that capture your unique essence.
          </p>
        </div>
      </StickyShowcaseSection>
    </div>
  )
}
