'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useGenderFilter } from '@/lib/hooks/use-gender-filter'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useStyleConfigs } from '@/hooks/useConfig'
import { StyleConfigsSchema, type Style } from '@/types/styles'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

export function StylesCarousel() {
  const { i18n } = useTranslation(['styles'])
  const currentLang = i18n.language
  const { gender, isLoading: isGenderLoading } = useUserGender()
  const { data: styleConfigs = [] } = useStyleConfigs()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0,
    align: 'center',
    containScroll: false,
    duration: 30
  })

  // Validate style configs and transform to expected format
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

  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined)
  
  const stylesWithImages = useMemo(() => {
    return filteredStyles.map(style => ({
      ...style,
      genderSpecificImages: getStyleImages(style.preview_images, gender || undefined)
    }))
  }, [filteredStyles, gender])

  // Set up carousel events
  useEffect(() => {
    if (emblaApi) {
      const onSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap())
      }

      emblaApi.on('select', onSelect)
      emblaApi.reInit()

      return () => {
        emblaApi.off('select', onSelect)
      }
    }
  }, [emblaApi])

  const getTranslatedField = (style: any, field: keyof typeof style.translations[string]): string => {
    if (style.translations?.[currentLang]?.[field]) {
      return style.translations[currentLang][field]
    }
    return style[field] || ''
  }

  if (isGenderLoading || stylesWithImages.length === 0) {
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
      <div className="w-full relative overflow-hidden rounded-md" ref={emblaRef}>
        <div className="flex">
          {stylesWithImages.map((style, index) => (
            <div 
              key={style.id} 
              className="flex-[0_0_100%] min-w-0"
            >
              <div className="h-[300px] bg-[#F0F9F7] rounded-md overflow-hidden">
                {/* Image Strip */}
                <div className="flex h-4/5 overflow-hidden">
                  {style.genderSpecificImages.slice(0, 5).map((imgSrc, idx) => (
                    <div key={idx} className="flex-1 relative overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={`${style.name} preview image ${idx + 1}`}
                        fill
                        sizes="(max-width: 200px) 400px, 200px"
                        className="object-cover"
                        priority={index === selectedIndex}
                      />
                    </div>
                  ))}
                </div>

                {/* Style Name */}
                <div className="h-1/5 flex items-center justify-center px-4 bg-white">
                  <h3 className="text-lg font-semibold text-black text-center">
                    {getTranslatedField(style, 'name')}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      {stylesWithImages.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {stylesWithImages.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                selectedIndex === index 
                  ? "bg-[#44E3C9]" 
                  : "bg-gray-300"
              )}
              aria-label={`Go to style ${index + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
} 