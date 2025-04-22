'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { StylePhotographyStyle, Gender, StyleStatus } from '@/lib/types'
import stylesConfig from '@/lib/config/styles.json'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useGenderFilter } from '@/lib/hooks/use-gender-filter'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { BackgroundImageSelector } from '@/components/style/background-image-selector'
import { OutfitImageSelector } from '@/components/style/outfit-image-selector'
import { OutfitColorSelector } from '@/components/style/outfit-color-selector'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { saveStyle } from '@/lib/api/styles'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { ensureUserProgress } from '@/lib/api/progress'
import { useStyleStore } from '@/store/style'
import { motion, AnimatePresence } from 'framer-motion'
import stylesCSS from './page.module.css'
import { Icon } from '@/components/icons/icon'

// Create a Zod enum from the Gender type
const GenderEnum = z.enum(['male', 'female'] as const) satisfies z.ZodType<Gender>;

// Define the validation schema
const StyleConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  previewImages: z.array(z.string()),
  availableGenders: z.array(GenderEnum).optional(),
  availableBackgrounds: z.array(z.string()),
  availableOutfits: z.array(z.string()),
  availableOutfitColors: z.array(z.string())
});

const StyleConfigsSchema = z.array(StyleConfigSchema);

// Validate at runtime with error handling
const photographyStyleOptions = (() => {
  try {
    return StyleConfigsSchema.parse(stylesConfig);
  } catch (error) {
    console.error('Invalid style configuration:', error);
    return [];
  }
})();

// Modify the fadeAnimation object to include variants for the options section
const fadeAnimation = {
  initial: { scale: 1 },
  animate: { scale: 1 },
  exit: { scale: 1 },
  transition: { duration: 0.3 }
}

const optionsAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2, ease: "easeOut" }
}

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { settings } = useStyleStore()
  const [isSaving, setIsSaving] = useState(false)
  const { gender, isLoading: isGenderLoading } = useUserGender();
  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined);
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showingCustomizeFor, setShowingCustomizeFor] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0,
    align: 'center',
    containScroll: false,
    duration: 30,
  })
  
  useEffect(() => {
    if (emblaApi) {
      let lastSelectedIndex = emblaApi.selectedScrollSnap();
      
      const onSelect = () => {
        const currentIndex = emblaApi.selectedScrollSnap();
        if (currentIndex !== lastSelectedIndex) {
          setShowingCustomizeFor(null);
          lastSelectedIndex = currentIndex;
        }
        setSelectedIndex(currentIndex);
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
      }

      const onPointerDown = () => {
        setIsNavigating(true);
      }

      const onPointerUp = () => {
        setTimeout(() => setIsNavigating(false), 500);
      }

      emblaApi.on('select', onSelect);
      emblaApi.on('pointerDown', onPointerDown);
      emblaApi.on('pointerUp', onPointerUp);
      
      // Initial state
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
      
      emblaApi.reInit()

      return () => {
        emblaApi.off('select', onSelect);
        emblaApi.off('pointerDown', onPointerDown);
        emblaApi.off('pointerUp', onPointerUp);
      }
    }
  }, [emblaApi])

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      setIsNavigating(true);
      setShowingCustomizeFor(null);
      emblaApi.scrollPrev();
      setTimeout(() => setIsNavigating(false), 1000);
    }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      setIsNavigating(true);
      setShowingCustomizeFor(null);
      emblaApi.scrollNext();
      setTimeout(() => setIsNavigating(false), 1000);
    }
  }, [emblaApi])

  const stylesWithImages = useMemo(() => {
    return filteredStyles.map(style => ({
      ...style,
      genderSpecificImages: getStyleImages(style.previewImages, gender || undefined)
    }));
  }, [filteredStyles, gender]);

  // Redirect if no styles available
  useEffect(() => {
    if (!isGenderLoading && stylesWithImages.length === 0) {
      router.push('/app/profile')
    }
  }, [isGenderLoading, stylesWithImages.length, router])

  const handleAddToShoot = async (style: {
    id: string;
    name: string;
    description: string;
    previewImages: string[];
    availableGenders?: Gender[];
    availableBackgrounds: string[];
    availableOutfits: string[];
    availableOutfitColors: string[];
    genderSpecificImages: string[];
  }) => {
    if (!user) {
      toast({
        title: 'Sign in Required',
        description: 'Please sign in to save styles.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSaving(true)
      const order = await getOrCreateDraftOrder(user.id)
      const orderId = order.id

      const formattedName = `${style.id} ${settings.outfit} (${settings.outfitColor}) ${settings.background}`
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      const styleData = {
        user_id: user.id,
        order_id: orderId,
        name: formattedName,
        settings: {
          photographyStyle: style.id as StylePhotographyStyle,
          outfit: settings.outfit,
          background: settings.background,
          outfitColor: settings.outfitColor,
        },
        status: 'draft' as StyleStatus
      }

      await saveStyle(styleData)
      await ensureUserProgress(user.id)

      toast({
        title: 'Success',
        description: 'Style has been added to your shoot'
      })

      router.push('/app/shoot')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save style'
      toast({
        title: 'Error Saving Style',
        description: message,
        variant: 'destructive'
      })
      console.error("Save Error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isGenderLoading || stylesWithImages.length === 0) {
    return null;
  }

  return (
    <div className="wrapper flex flex-col overflow-hidden">
      <motion.div 
        className="flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={cn("w-full mx-auto relative", stylesCSS['carousel-container'])}>          
          {/* Highlight overlay */}
          <div className={stylesCSS['highlight-overlay']} />
          
          {/* Carousel container */}
          <div className="w-full relative" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {stylesWithImages.map((style, index) => (
                <div 
                  key={style.id} 
                  className="flex-[0_0_70%] max-w-[1024px] relative transition-all duration-300"
                >
                  <div className="relative h-full">
                    {/* Toggle between style overview and customization options */}
                    {showingCustomizeFor === index ? (
                      <motion.div
                        key="customization-options"
                        className={cn(
                          stylesCSS.slideCard,
                          "absolute inset-0 bg-white overflow-hidden transition-all duration-500 select-none",
                          selectedIndex === index 
                            ? stylesCSS.activeSlide
                            : stylesCSS.inactiveSlide
                        )}
                        {...fadeAnimation}
                      >
                        {/* Customization Options Content */}
                        <div className="h-full">
                          <div className="flex items-center justify-between p-6 border-b text-black">
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => {
                                  setIsNavigating(false);
                                  setShowingCustomizeFor(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <h2 className="text-2xl font-semibold">{style.name}</h2>
                            </div>
                            <Button 
                              onClick={() => handleAddToShoot(style)}
                              className="rounded-full px-6"
                              disabled={isSaving}
                            >
                              {isSaving ? 'Adding...' : 'Add to Shoot'}
                            </Button>
                          </div>

                          {/* Options Sections */}
                          <div className="p-6 space-y-8">
                            <motion.section
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={optionsAnimation}
                            >
                              <h3 className="text-gray-500 mb-4">Background</h3>
                              <BackgroundImageSelector photographyStyle={style.id as StylePhotographyStyle} />
                            </motion.section>

                            <motion.section
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={optionsAnimation}
                              transition={{ delay: 0.1 }}
                            >
                              <h3 className="text-gray-500 mb-4">Clothing Color</h3>
                              <OutfitColorSelector photographyStyle={style.id as StylePhotographyStyle} />
                            </motion.section>

                            <motion.section
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              variants={optionsAnimation}
                              transition={{ delay: 0.2 }}
                            >
                              <h3 className="text-gray-500 mb-4">Clothing</h3>
                              <OutfitImageSelector photographyStyle={style.id as StylePhotographyStyle} />
                            </motion.section>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="style-overview"
                        className={cn(
                          stylesCSS.slideCard,
                          "flex flex-col overflow-hidden transition-all duration-500 select-none h-full",
                          selectedIndex === index 
                            ? stylesCSS.activeSlide
                            : stylesCSS.inactiveSlide,
                          isNavigating && stylesCSS.sliding
                        )}
                        {...(isNavigating ? {} : fadeAnimation)}
                      >
                        {/* Image Strip */}
                        <div className={stylesCSS['image-strip']}>
                          {style.genderSpecificImages.slice(0, 5).map((imgSrc, idx) => (
                            <div key={idx} className="flex-1 relative">
                              <Image
                                src={imgSrc}
                                alt={`${style.name} Example ${idx + 1}`}
                                fill
                                className="object-cover"
                                priority={idx === 0}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Content Section */}
                        <div className="bg-[#F0F9F7] p-8">
                          {/* Style Name and Customize Button */}
                          <div className="flex justify-start items-center mb-[56px]">
                            <h2 className="text-[2rem] font-light text-[#C0C7C6] flex-1 max-w-[180px]">Style</h2>
                            <h3 className="text-[2rem] font-bold text-black flex-1 tracking-tight">{style.name}</h3>
                            <Button 
                              variant="primary"
                              onClick={() => {
                                setIsNavigating(false);
                                setShowingCustomizeFor(index);
                              }}
                            >
                              Customise
                            </Button>
                          </div>

                          {/* Description */}
                          <div className="flex justify-start items-end mb-4">
                            <div className="flex flex-1 justify-start items-start">
                              <div className="flex-1 max-w-[180px]">
                                <p className="text-[15px] font-semibold text-black leading-[18px] max-w-[100px]">
                                  {style.tagline}
                                </p>
                              </div>
                              <div className="flex-1">
                                <p className="text-[#909594] text-[15px] leading-[22px] max-w-[360px]">
                                  {style.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 text-[#00000060]">
                              <Icon
                                variant="background"
                                size={28}
                                className="p-2 box-content"
                              />
                              <Icon
                                variant="style"
                                size={28}
                                className="p-2 box-content"
                              />
                              <Icon
                                variant="clothing"
                                size={28}
                                className="p-2 box-content"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <div className={stylesCSS['navigation-buttons']}>
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/50"
        >
          <Icon variant="arrow-left" size={20} className="text-[#44E3C9]" />
          Prev
        </button>
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/50"
        >
          Next
          <Icon variant="arrow-right" size={20} className="text-[#44E3C9]" />
        </button>
      </div>
    </div>
  )
} 