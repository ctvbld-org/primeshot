'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StylePhotographyStyle, Gender, StyleStatus } from '@/lib/types'
import stylesConfig from '@/lib/config/styles.json'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useGenderFilter } from '@/lib/hooks/use-gender-filter'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { saveStyle } from '@/lib/api/styles'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { ensureUserProgress } from '@/lib/api/progress'
import { useStyleStore } from '@/store/style'
import { motion, AnimatePresence } from 'framer-motion'
import stylesCSS from './page.module.css'
import { Icon } from '@/components/icons/icon'
import { StyleTabsOptions } from '@/components/style/style-tabs-options'
import { StyleDetails } from '@/components/style/style-details'

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
  availableClothing: z.array(z.string()),
  availableClothingColor: z.array(z.string())
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { 
    duration: 0.5,
    ease: [0.32, 0.72, 0, 1] // Custom easing for smoother motion
  }
}

// Update the type definitions to match the actual data structure
type BaseOption = {
  id: string;
  label: string;
};

type ImageOption = BaseOption & {
  imageUrl: string;
};

type ColorOption = BaseOption;

type CategoryOption = ImageOption | ColorOption;

function isImageOption(option: any): option is ImageOption {
  return option && typeof option === 'object' && 'imageUrl' in option && typeof option.imageUrl === 'string';
}

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { gender, isLoading: isGenderLoading } = useUserGender();
  const [selectedIndex, setSelectedIndex] = useState(0)
  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined)
  // Get the current style ID based on the selected index
  const currentStyleId = selectedIndex >= 0 && filteredStyles.length > 0 
    ? filteredStyles[selectedIndex].id as StylePhotographyStyle 
    : 'studio'
  const store = useStyleStore(currentStyleId)
  const settings = store((state) => state.settings)
  const reset = store((state) => state.reset)
  const [showingCustomizeFor, setShowingCustomizeFor] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0,
    align: 'center',
    containScroll: false,
    duration: 30
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousIndex, setPreviousIndex] = useState(selectedIndex)
  
  useEffect(() => {
    if (emblaApi) {
      if (showingCustomizeFor !== null) {
        setIsTransitioning(true)
        emblaApi.reInit({ 
          dragFree: false,
          watchDrag: false
        })
      } else {
        emblaApi.reInit({ 
          dragFree: false,
          watchDrag: true
        })
      }
    }
  }, [emblaApi, showingCustomizeFor])

  // Reset settings when selectedIndex changes
  useEffect(() => {
    if (selectedIndex !== previousIndex) {
      // Reset settings for the previous style
      if (previousIndex >= 0 && filteredStyles.length > 0) {
        const previousStyleId = filteredStyles[previousIndex].id as StylePhotographyStyle
        const previousStore = useStyleStore(previousStyleId)
        previousStore.getState().reset()
      }
      
      // Reset settings for the new style
      reset()
      
      // Update previousIndex
      setPreviousIndex(selectedIndex)
    }
  }, [selectedIndex, previousIndex, filteredStyles, reset])

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
    availableClothing: string[];
    availableClothingColor: string[];
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

      // Get current store for this style
      const styleStore = useStyleStore(style.id as StylePhotographyStyle)
      const currentSettings = styleStore.getState().settings
      
      const styleData = {
        user_id: user.id,
        order_id: orderId,
        name: style.name,
        settings: {
          photographyStyle: style.id as StylePhotographyStyle,
          background: currentSettings.background,
          clothing: currentSettings.clothing,
          clothingColor: currentSettings.clothingColor,
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

  const handleTransitionEnd = useCallback(() => {
    if (showingCustomizeFor === null) {
      setIsTransitioning(false)
    }
  }, [showingCustomizeFor])

  const containerStyle = useMemo(() => ({
    transition: isTransitioning ? 'transform 1000ms cubic-bezier(.34,.08,0,1.01)' : 'none'
  }), [isTransitioning])


  if (isGenderLoading || stylesWithImages.length === 0) {
    return null;
  }

  return (
    <div className="wrapper flex flex-col">
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
            <div 
              className="flex touch-pan-y"
              style={containerStyle}
              onTransitionEnd={handleTransitionEnd}
            >
              {stylesWithImages.map((style, index) => (
                <div 
                  key={style.id} 
                  className={stylesCSS['slide-card-container']}
                >
                  <div className="relative h-full bg-[#F0F9F7]">
                    {/* Toggle between style overview and customization options */}
                    <AnimatePresence mode="wait">
                      {showingCustomizeFor === index ? (
                        <motion.div
                          key="customization-options"
                          className={cn(
                            stylesCSS['slide-card'],
                            "absolute inset-0 bg-white overflow-hidden transition-all duration-500 select-none",
                            selectedIndex === index 
                              ? stylesCSS['active-slide']
                              : stylesCSS['inactive-slide']
                          )}
                          {...fadeAnimation}
                        >
                          <StyleTabsOptions
                            style={{
                              ...style,
                              styleId: 'new'
                            }}
                            isSaving={isSaving}
                            onClose={() => setShowingCustomizeFor(null)}
                            onAddToShoot={handleAddToShoot}
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="style-overview"
                          className={cn(
                            stylesCSS['slide-card'],
                            "flex flex-col overflow-hidden transition-all duration-500 select-none h-full bg-[#F0F9F7]",
                            selectedIndex === index 
                              ? stylesCSS['active-slide']
                              : stylesCSS['inactive-slide'],
                            isNavigating && stylesCSS.sliding
                          )}
                          {...(isNavigating ? {} : fadeAnimation)}
                        >
                          <StyleDetails
                            style={style}
                            index={index}
                            onCustomize={setShowingCustomizeFor}
                            setIsNavigating={setIsNavigating}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
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
          <Icon variant="arrowLeft" size={20} className="text-[#44E3C9]" />
          Prev
        </button>
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/50"
        >
          Next
          <Icon variant="arrowRight" size={20} className="text-[#44E3C9]" />
        </button>
      </div>
    </div>
  )
} 