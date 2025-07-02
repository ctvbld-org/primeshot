'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useStyleConfigs } from '@/hooks/useConfig'
import { StyleConfigsSchema, type Style } from '@/types/styles'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@/components/icons/icon'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useStyleSelection } from '@/contexts/style-selection-context'
import styles from './StylesCarousel.module.css'

export function StylesCarousel() {
  const { t, i18n } = useTranslation(['styles', 'common'])
  const currentLang = i18n.language
  const { data: styleConfigs = [], isLoading } = useStyleConfigs()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0,
    align: 'center',
    containScroll: false,
    duration: 30
  })
  
  // Import and use the style selection context
  const { setSelectedStyleIndex, setStylesData } = useStyleSelection()

  // Validate style configs and transform to expected format (no gender filtering)
  const photographyStyleOptions = useMemo(() => {
    try {
      const validatedConfigs = StyleConfigsSchema.parse(styleConfigs)
      return validatedConfigs.map((config: Style) => ({
        id: config.id,
        name: config.name,
        tagline: config.tagline,
        description: config.description,
        preview_images: config.preview_images,
        available_genders: config.available_genders,
        available_backgrounds: config.available_backgrounds,
        available_clothing: config.available_clothing,
        available_clothing_colors: config.available_clothing_colors,
        translations: config.translations
      }))
    } catch (error) {
      console.error('Invalid style configuration:', error)
      return []
    }
  }, [styleConfigs])


  const stylesWithImages = useMemo(() => {
    return photographyStyleOptions.map(style => ({
      ...style,
      genderSpecificImages: getStyleImages(style.preview_images),
      translations: style.translations
    }));
  }, [photographyStyleOptions]);

  // Set up carousel events
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        const newIndex = emblaApi.selectedScrollSnap()
        setSelectedIndex(newIndex)
        setSelectedStyleIndex(newIndex) // Update context
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

  const handleExploreStyles = () => {
    // Add your navigation logic here - e.g., router.push('/app/styles')
    for (const style of stylesWithImages) {
      console.log('Explore style:', style.name)
    }
  }

  if (isLoading || photographyStyleOptions.length === 0) {
    return (
      <div className={styles.skeletonContainer}>
        <div className={styles.skeletonInner} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Highlight overlay */}
      <div className={styles.highlightOverlay} />
      
      {/* Carousel container */}
      <div className={styles.carouselWrapper} ref={emblaRef}>
        <div className={styles.slidesContainer}>
          {photographyStyleOptions.map((style, index) => (
            <div 
              key={style.id} 
              className={`${styles.slide} ${selectedIndex === index ? styles.active : ''}`}
            >
              <div className={styles.slideInner}>
                {/* Single preview image */}
                <div className={styles.imageWrapper}>
                  <Image
                    src={style.preview_images.length > 0 ? getStyleImages([style.preview_images[0]])[0] : ''}
                    alt={`${style.name} preview`}
                    fill
                    sizes="500px"
                    className="object-cover"
                    priority={index === selectedIndex}
                  />
                  
                  <div className={`${styles.overlay} ${selectedIndex === index ? styles.active : ''}`}>
                    {/* Title at top */}
                    <div>
                      <h3 className={styles.title}>
                        {getTranslatedField(style, 'name')}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action button at bottom */}
      <div className={styles.actionButtonWrapper}>
        <Button 
          onClick={() => handleExploreStyles()}
          className={styles.actionButton}
        >
          {t('buttons.explore', { ns: 'common' })}
        </Button>
      </div>

      {/* Navigation Buttons */}
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
  )
} 