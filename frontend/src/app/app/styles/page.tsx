'use client'

import { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StylePhotographyStyle, Gender, StyleStatus } from '@/lib/types'
import { getStyleImages } from '@/lib/utils/get-styles-images'
import { useUserGender } from '@/lib/hooks/use-user-gender'
import { useGenderFilter } from '@/lib/hooks/use-gender-filter'
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
import { useStyleConfigs } from '@/hooks/useConfig'
import { useTranslation } from 'react-i18next'
import { CarouselProvider } from '@/contexts/carousel-context'
import { fadeAnimation } from '@/constants/animations'
import { StyleConfigsSchema, Style } from '@/types/styles'

// Custom hook to handle style stores
function useStyleStores(styles: Array<Style>) {
  // Create a ref to hold all stores
  const storesRef = useRef<Record<string, ReturnType<typeof useStyleStore>>>({});
  
  // Create a single store for the currently selected style
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  
  // Initialize all stores on mount and clean up when styles change
  useEffect(() => {
    // Get the current style IDs
    const currentStyleIds = new Set(styles.map(style => style.id));
    
    // Clean up stores that are no longer needed
    Object.keys(storesRef.current).forEach(styleId => {
      if (!currentStyleIds.has(styleId)) {
        delete storesRef.current[styleId];
      }
    });
    
    // Initialize new stores
    styles.forEach(style => {
      if (!storesRef.current[style.id]) {
        storesRef.current[style.id] = useStyleStore(style.id as StylePhotographyStyle);
      }
    });
    
    // Return cleanup function
    return () => {
      // Clear all stores on unmount
      storesRef.current = {};
    };
  }, [styles]);

  const getStore = useCallback((styleId: string) => {
    return storesRef.current[styleId];
  }, []);

  return {
    getStore,
    storesRef,
    setSelectedStyleId
  };
}

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation(['common', 'styles'])
  const [isSaving, setIsSaving] = useState(false)
  const { gender, isLoading: isGenderLoading } = useUserGender();
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data: styleConfigs = [] } = useStyleConfigs();
  const [previousIndex, setPreviousIndex] = useState(selectedIndex)
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

  // Validate style configs at runtime and transform to expected format
  const photographyStyleOptions = useMemo(() => {
    try {
      const validatedConfigs = StyleConfigsSchema.parse(styleConfigs);
      return validatedConfigs.map(config => ({
        id: config.id,
        name: config.name,
        tagline: config.tagline,
        description: config.description,
        preview_images: config.preview_images,
        availableGenders: config.available_genders,
        available_backgrounds: config.available_backgrounds,
        available_clothing: config.available_clothing,
        available_clothing_colors: config.available_clothing_colors,
        translations: config.translations
      }));
    } catch (error) {
      console.error('Invalid style configuration:', error);
      return [];
    }
  }, [styleConfigs]);

  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined)
  
  // Use our custom hook
  const { getStore, storesRef, setSelectedStyleId } = useStyleStores(filteredStyles);

  const stylesWithImages = useMemo(() => {
    return filteredStyles.map(style => ({
      ...style,
      genderSpecificImages: getStyleImages(style.preview_images, gender || undefined),
      translations: style.translations
    }));
  }, [filteredStyles, gender]);

  // Reset settings when selectedIndex changes
  useEffect(() => {
    if (selectedIndex !== previousIndex) {
      // Reset settings for the previous style
      if (previousIndex >= 0 && filteredStyles.length > 0) {
        const previousStyleId = filteredStyles[previousIndex].id as StylePhotographyStyle;
        const store = getStore(previousStyleId);
        if (store) {
          store.getState().reset();
        }
      }
      
      // Reset settings for the new style
      if (selectedIndex >= 0 && filteredStyles.length > 0) {
        const currentStyleId = filteredStyles[selectedIndex].id as StylePhotographyStyle;
        const store = getStore(currentStyleId);
        if (store) {
          store.getState().reset();
        }
      }
      
      // Update previousIndex
      setPreviousIndex(selectedIndex);
    }
  }, [selectedIndex, previousIndex, filteredStyles, getStore]);

  const handleAddToShoot = useCallback(async (style: {
    id: string;
    name: string;
    description: string;
    preview_images: string[];
    available_genders?: Gender[];
    available_backgrounds: string[];
    available_clothing: string[];
    available_clothing_colors: string[];
    genderSpecificImages: string[];
    translations: {
      [lang: string]: {
        name: string;
        tagline: string;
        description: string;
      }
    };
  }) => {
    try {
      if (!user) {
        throw new Error('User not found')
      }

      setIsSaving(true)
      const order = await getOrCreateDraftOrder(user.id)
      const orderId = order.id

      const store = getStore(style.id);
      if (!store) {  
        throw new Error(`Store not found for style ID: ${style.id}`);  
      }  
      const currentSettings = store.getState().settings
      
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
        title: t('toast.successAddedStyle.title', { ns: 'styles' }),
        description: t('toast.successAddedStyle.description', { ns: 'styles' }),
      })

      router.push('/app/shoot')
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        description: t('toast.errorSavingStyle.description', { ns: 'styles' }),
        title: t('toast.errorSavingStyle.title', { ns: 'styles' }),
      })
    } finally {
      setIsSaving(false)
    }
  }, [user, getStore, router, toast, t])

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
    <div className={stylesCSS.container}>
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
          <CarouselProvider>
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
          </CarouselProvider>
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
          {t('buttons.previous', { ns: 'common' })}
        </button>
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/50"
        >
          {t('buttons.next', { ns: 'common' })}
          <Icon variant="arrowRight" size={20} className="text-[#44E3C9]" />
        </button>
      </div>
    </div>
  )
} 