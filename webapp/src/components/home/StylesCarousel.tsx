'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { useStyleConfigs } from '@/hooks/useConfig'
import { StyleConfigsSchema, type Style } from '@/types/styles'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Button } from '@primeshot/common/web/ui/button'
import { Icon } from '@/components/icons/icon'

export function StylesCarousel() {
  const { i18n } = useTranslation(['styles', 'common'])
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

  // Set up carousel events
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap())
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
  }, [emblaApi])

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

  const handleExploreStyle = (style: any) => {
    // Add your navigation logic here - e.g., router.push('/app/styles')
    console.log('Explore style:', style.name)
  }

  if (isLoading || photographyStyleOptions.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center border-2 border-dashed border-gray-500 rounded-md text-gray-400 animate-pulse">
        <div className="w-full h-full bg-gray-200 rounded-md" />
      </div>
    )
  }

  return (
    <motion.div 
      className="w-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="relative w-full">
        {/* Highlight overlay */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#44E3C9] w-[70%] max-w-[500px] h-[300px] rounded-2xl box-shadow-[0_0_0_100vmax_rgba(12,16,19,0.6)] clip-path-[inset(0_-100vmax)] z-10 pointer-events-none" />
        
        {/* Carousel container */}
        <div className="w-full relative overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {photographyStyleOptions.map((style, index) => (
              <div 
                key={style.id} 
                className="flex-[0_0_70%] max-w-[500px] overflow-hidden relative transition-all duration-300 ease-out"
              >
                <div className="h-[300px] bg-[#F0F9F7] rounded-2xl overflow-hidden relative">
                  {/* Single preview image */}
                  <div className="w-full h-full relative">
                    <Image
                      src={style.preview_images[0] || '/placeholder-image.jpg'}
                      alt={`${style.name} preview`}
                      fill
                      sizes="500px"
                      className="object-cover"
                      priority={index === selectedIndex}
                    />
                    
                    {/* Overlay content for active slide */}
                    {selectedIndex === index && (
                      <div className="absolute inset-0 bg-black/20 flex flex-col justify-between p-6">
                        {/* Title at top */}
                        <div>
                          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                            {getTranslatedField(style, 'name')}
                          </h3>
                        </div>
                        
                        {/* Action button at bottom */}
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => handleExploreStyle(style)}
                            className="bg-[#44E3C9] hover:bg-[#44E3C9]/90 text-black font-semibold px-6 py-2 rounded-full"
                          >
                            {t('buttons.explore', { ns: 'common' })}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t('buttons.previous', { ns: 'common' })}
        >
          <Icon variant="arrowLeft" size={20} />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t('buttons.next', { ns: 'common' })}
        >
          <Icon variant="arrowRight" size={20} />
        </button>
      </div>
    </motion.div>
  )
} 