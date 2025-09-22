'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useStyles } from '@/hooks/useConfig'
import { StyleConfigsSchema, type Style } from '@/types/styles'
import Image from 'next/image'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { useTranslation } from 'react-i18next'
import { Icon } from '@primeshot/common/web/Icon'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useStyleSelection } from '@/contexts/style-selection-context'
import { GenerateBar } from '@/components/generate/GenerateBar'
import { getStoredSelectedStyleIndex, storeSelectedStyleIndex } from '@/lib/utils/style-storage'
import styles from './StylesCarousel.module.css'

export function StylesCarousel() {
  const { t, i18n } = useTranslation(['styles', 'common'])
  const currentLang = i18n.language
  const { data: styleConfigs = [], isLoading } = useStyles()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [initialIndexSet, setInitialIndexSet] = useState(false)
  
  // Import and use the style selection context
  const { setSelectedStyleIndex, setStylesData } = useStyleSelection()

  // Validate style configs and transform to expected format (no gender filtering)
  const photographyStyleOptions = useMemo(() => {
    try {
      const validatedConfigs = StyleConfigsSchema.parse(styleConfigs)
      // Sort by created_at DESC (newest first). Fallback to original order when missing.
      const sorted = [...validatedConfigs].sort((a: any, b: any) => {
        const at = a.created_at ? Date.parse(a.created_at as string) : 0
        const bt = b.created_at ? Date.parse(b.created_at as string) : 0
        return bt - at
      })
      return sorted.map((config: Style) => ({
        id: config.id,
        name: config.name,
        preview_images: config.preview_images,
        available_scenes: config.available_scenes,
        available_wardrobes: config.available_wardrobes,
        available_colors: config.available_colors,
        translations: config.translations
      }))
    } catch (error) {
      console.error('Invalid style configuration:', error)
      return []
    }
  }, [styleConfigs])

  // Get initial index from localStorage or default to 0
  const getInitialIndex = useCallback(() => {
    const storedIndex = getStoredSelectedStyleIndex()
    if (storedIndex !== null && storedIndex >= 0 && storedIndex < photographyStyleOptions.length) {
      return storedIndex
    }
    return 0
  }, [photographyStyleOptions.length])

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0, // Will be updated when styles load
    align: 'center',
    containScroll: false,
    duration: 30,
    loop: true,
  })

  // Helper to determine if a slide index is near the current index in a looping carousel
  const isNearSelected = useCallback((idx: number, selected: number, total: number) => {
    const delta = Math.abs(idx - selected)
    return Math.min(delta, total - delta) <= 1 // within 1 slide on either side
  }, [])

  // Load persisted selection and initialize carousel when styles are available
  useEffect(() => {
    if (photographyStyleOptions.length > 0 && emblaApi && !initialIndexSet) {
      const initialIndex = getInitialIndex()
      setSelectedIndex(initialIndex)
      setSelectedStyleIndex(initialIndex)
      emblaApi.scrollTo(initialIndex, true) // true = instant scroll
      setInitialIndexSet(true)
    }
  }, [photographyStyleOptions.length, emblaApi, getInitialIndex, setSelectedStyleIndex, initialIndexSet])

  // Set up carousel events
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        const newIndex = emblaApi.selectedScrollSnap()
        setSelectedIndex(newIndex)
        setSelectedStyleIndex(newIndex) // Update context
        storeSelectedStyleIndex(newIndex) // Persist selection
        setCanScrollPrev(emblaApi.canScrollPrev())
        setCanScrollNext(emblaApi.canScrollNext())
      }

      emblaApi.on('select', onSelect)
      emblaApi.reInit()

      // Initial state
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())

      return () => {
        emblaApi.off('select', onSelect)
      }
    }
  }, [emblaApi, setSelectedStyleIndex])

  // Update styles data in context when it changes
  useEffect(() => {
    if (photographyStyleOptions.length > 0) {
      setStylesData(photographyStyleOptions)
    }
  }, [photographyStyleOptions, setStylesData])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const getTranslatedField = (style: any, field: keyof typeof style.translations[string]): string => {
    if (style.translations?.[currentLang]?.[field]) {
      return style.translations[currentLang][field]
    }
    return style[field] || ''
  }

  // subtitle translation is constant per request

  if (isLoading || photographyStyleOptions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.carouselWrapper} ref={emblaRef}>
          <div className={styles.slidesContainer + ' ' + styles.skeletonContainer}>
            <div className={styles.slide + ' ' + styles.skeletonInner}></div>
            <div className={styles.slide + ' ' + styles.active + ' ' + styles.skeletonInner}></div>
            <div className={styles.slide + ' ' + styles.skeletonInner}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} data-styles-container>
      {/* Highlight overlay */}
      
      {/* Carousel container */}
      <div className={styles.carouselWrapper} ref={emblaRef}>
        <div className={styles.slidesContainer}>
          {photographyStyleOptions.map((style, index) => {
            const isActive = selectedIndex === index
            const isPrev = index === (selectedIndex - 1 + photographyStyleOptions.length) % photographyStyleOptions.length
            const isNext = index === (selectedIndex + 1) % photographyStyleOptions.length

            return (
              <div
                key={style.id}
                className={`${styles.slide} ${isActive ? styles.active : ''} ${isPrev ? styles.prev : ''} ${isNext ? styles.next : ''}`}
              >
                <div className={styles.slideInner}>
                  {/* Single preview image */}
                  <div className={styles.imageWrapper}>
                    <Image
                      loader={makeCloudfrontLoader('app-images/placeholders/styles')}
                      src={style.preview_images.length > 0 ? style.preview_images[0] : ''}
                      alt={`${style.name} preview`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
                      quality={80}
                      loading={isNearSelected(index, selectedIndex, photographyStyleOptions.length) ? 'eager' : 'lazy'}
                      decoding="async"
                      className="object-cover"
                      priority={index === selectedIndex}
                    />

                    <div className={`${styles.overlay} ${isActive ? styles.active : ''}`}>
                      <div className={styles.textBlock}>
                        <div className={styles.subtitle}>{t('titles.photoStyle', { ns: 'styles' })}</div>
                        <h3 className={styles.title}>{getTranslatedField(style, 'name')}</h3>
                        <button className={styles.actionButton}>Examples</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className={styles.carouselButtons}>
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={`${styles.navButton} ${styles.navButtonLeft}`}
          aria-label={t('buttons.previous', { ns: 'common' })}
        >
          <Icon variant="arrowLeft" size={20} />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={`${styles.navButton} ${styles.navButtonRight}`}
          aria-label={t('buttons.next', { ns: 'common' })}
        >
          <Icon variant="arrowRight" size={20} />
        </button>
      </div>

      {/* Fixed small thumbnail of the current style */}
      <div className={styles.fixedThumb}>
        {photographyStyleOptions[selectedIndex]?.preview_images?.[0] && (
          <Image
            loader={makeCloudfrontLoader('app-images/placeholders/styles')}
            src={photographyStyleOptions[selectedIndex].preview_images[0]}
            alt={photographyStyleOptions[selectedIndex].name}
            width={123}
            height={167}
            quality={100}
            className="object-cover rounded-lg"
          />
        )}
      </div>

      <GenerateBar emblaApi={emblaApi || null} onPanelToggle={(open: boolean) => {
        const container = document.querySelector(`.${styles.container}`) as HTMLElement | null
        if (!container) return
        container.classList.toggle(styles.panelOpen, !!open)
      }} />
    </div>
  )
} 