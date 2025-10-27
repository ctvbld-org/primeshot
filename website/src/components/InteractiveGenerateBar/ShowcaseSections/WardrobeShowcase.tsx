'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Icon } from '@primeshot/common/web/Icon'
import { StickyShowcaseSection } from '../StickyShowcaseSection'
import { useScrollSection } from '../ScrollSectionManager'
import cssStyles from '../ShowcaseSection.module.css'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { useTranslation } from 'react-i18next'

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

export function WardrobeShowcase() {
  const { t } = useTranslation('homepage')
  const [styles, setStyles] = useState<Style[]>([])
  const [randomImages, setRandomImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { activePanel, isPanelOpen, selectedColorId } = useScrollSection()
  
  // Show colors title when wardrobe panel is open
  const showColors = isPanelOpen && activePanel === 'wardrobe'

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

  // Update images when color is clicked (re-randomize)
  useEffect(() => {
    if (styles.length === 0) return

    // Get random images from all styles (no filtering)
    const allImages: string[] = []
    styles.forEach((style) => {
      if (style.preview_images && Array.isArray(style.preview_images)) {
        // Add full path for app-images structure
        const imagesWithPath = style.preview_images.map(img => 
          img.startsWith('placeholders/') ? img : `placeholders/styles/${img}`
        )
        allImages.push(...imagesWithPath)
      }
    })
    
    // Shuffle and select 6 random images
    const shuffled = shuffleArray(allImages)
    const newImages = shuffled.slice(0, 8)
    
    // Only update if we have enough images (don't show partial set)
    if (newImages.length >= 6) {
      setRandomImages(newImages)
    }
  }, [styles, selectedColorId])

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
      600, // Image 0: Move up
      300, // Image 1: Move up slower
      0,  // Image 2: Move down
      -300,  // Image 3: Move down slower
      -600,  // Image 4: Move up slow
      -100,  // Image 5: Move up
      -200,  // Image 6: Move down slower
      -300,  // Image 7: Move down slower
    ]

    const translateY = scrollProgress * parallaxSpeeds[index]

    return {
      transform: `translateY(${translateY}px)`,
      // Disable CSS transitions during scroll to prevent conflicts
      transition: hasScrolled ? 'none' : undefined,
      willChange: 'transform'
    }
  }

  return (
    <div ref={sectionRef}>
      <StickyShowcaseSection 
        className={`${cssStyles.container} ${cssStyles.wardrobeContainer}`}
        panelId="wardrobe"
      >
        <div>
          {/* Section Title */}
          <div className={cssStyles.content}>
            <div className={cssStyles.titleContainer}>
              <div className={cssStyles.iconWrapper}>
                <Icon
                  variant={showColors ? 'wardrobeColor' : 'wardrobe'}
                  size={48}
                  className="text-glacier transition-all duration-300"
                />
              </div>
              <h2 className={`${cssStyles.title} transition-all duration-300`}>
                {showColors ? t('sections.wardrobe.titleColors') : t('sections.wardrobe.title')}
              </h2>
            </div>
            <p className={cssStyles.subtitle}>
              {showColors
                ? t('sections.wardrobe.subtitleColors')
                : t('sections.wardrobe.subtitle')}
            </p>
          </div>

          {/* Parallax Wardrobe Images */}
          {!isLoading && randomImages.length >= 8 && (
            <div className={cssStyles.floatingImagesContainer}>
              {/* Image 1 - Top Left */}
              <div className={cssStyles.wardrobeImage1 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(0)}>
                <div className={`relative w-32 h-40 md:w-40 md:h-48`}>
                  <Image
                    src={randomImages[0]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 2 - Top Right */}
              <div className={cssStyles.wardrobeImage2 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(1)}>
                <div className={`relative w-32 h-40 md:w-40 md:h-48`}>
                  <Image
                    src={randomImages[1]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 3 - Middle Left */}
              <div className={cssStyles.wardrobeImage3 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(2)}>
                <div className={`relative w-32 h-40 md:w-40 md:h-48`}>
                  <Image
                    src={randomImages[2]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 4 - Middle Right */}
              <div className={cssStyles.wardrobeImage4 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(3)}>
                <div className={`relative w-32 h-40 md:w-40 md:h-48`}>
                  <Image
                    src={randomImages[3]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 5 - Bottom Left */}
              <div className={cssStyles.wardrobeImage5 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(4)}>
                <div className={`relative w-32 h-40 md:w-40 md:h-48`}>
                  <Image
                    src={randomImages[4]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 6 - Bottom Right */}
              <div className={cssStyles.wardrobeImage6 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(5)}>
                <div className={`relative w-40 h-40 md:w-48 md:h-48`}>
                  <Image
                    src={randomImages[5]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 7 - Bottom Right */}
              <div className={cssStyles.wardrobeImage7 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(6)}>
                <div className={`rrelative w-40 h-40 md:w-48 md:h-48`}>
                  <Image
                    src={randomImages[6]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              {/* Image 6 - Bottom Right */}
              <div className={cssStyles.wardrobeImage8 + ' ' + cssStyles.floatingImage} style={getParallaxStyle(7)}>
                <div className={`relative w-40 h-40 md:w-48 md:h-48`}>
                  <Image
                    src={randomImages[7]}
                    alt="Wardrobe option"
                    fill
                    className="object-cover"
                    loader={cloudfrontLoader}
                  />
                </div>
              </div>

              
            </div>
          )}
        </div>
      </StickyShowcaseSection>
    </div>
  )
}
