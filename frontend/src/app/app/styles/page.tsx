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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import optionsConfig from '@/lib/config/options.json'
import { getOptionsImage } from '@/lib/utils/get-options-image'

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
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
}

// Add new animation variants for the content sections
const contentAnimation = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { 
    duration: 0.5,
    ease: [0.21, 1, 0.32, 1],
    staggerChildren: 0.08 
  }
}

const childAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.21, 1, 0.32, 1] }
}

// Map category IDs to icon variants
const categoryIconMap: Record<keyof typeof optionsConfig, React.ComponentProps<typeof Icon>['variant']> = {
  background: 'background',
  clothing: 'clothing',
  clothingColor: 'clothingColor'
};

// Map category IDs to components
const categoryComponentMap: Record<string, React.ComponentType<{ photographyStyle: StylePhotographyStyle }>> = {
  background: BackgroundImageSelector,
  clothingColor: OutfitColorSelector,
  clothing: OutfitImageSelector
};

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
  const { settings, reset } = useStyleStore()
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
    duration: 30
  })
  const [activeTab, setActiveTab] = useState(Object.keys(optionsConfig)[0])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([Object.keys(optionsConfig)[0]]))
  
  // Reset style store and visited tabs when options section is hidden
  useEffect(() => {
    if (showingCustomizeFor === null) {
      reset();
      setActiveTab(Object.keys(optionsConfig)[0]);
      setVisitedTabs(new Set([Object.keys(optionsConfig)[0]])); // Reset visited tabs
    }
  }, [showingCustomizeFor, reset]);
  
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

  const handleTransitionEnd = useCallback(() => {
    if (showingCustomizeFor === null) {
      setIsTransitioning(false)
    }
  }, [showingCustomizeFor])

  const containerStyle = useMemo(() => ({
    transition: isTransitioning ? 'transform 1000ms cubic-bezier(.34,.08,0,1.01)' : 'none'
  }), [isTransitioning])

  // Track tab visits
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setVisitedTabs(prev => new Set([...prev, value]));
  }, []);

  // Handle footer button clicks
  const handleFooterButtonClick = useCallback((categoryId: string) => {
    handleTabChange(categoryId);
  }, [handleTabChange]);

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
            <div 
              className="flex touch-pan-y"
              style={containerStyle}
              onTransitionEnd={handleTransitionEnd}
            >
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
                        {/* Close Button */}
                        <button
                          onClick={() => setShowingCustomizeFor(null)}
                          className="absolute top-8 right-8 z-50 w-10 h-10 rounded-full bg-[#00000015] flex items-center justify-center hover:bg-accent/15 cursor-pointer transition-all text-black"
                        >
                          <Icon variant="cross" size={16} />
                        </button>

                        {/* Tabs Container */}
                        <div className={stylesCSS['tabs-container']}>
                          <Tabs 
                            value={activeTab}
                            onValueChange={handleTabChange}
                            orientation="vertical" 
                            className="h-full"
                          >
                            <motion.div
                              initial="initial"
                              animate="animate"
                              variants={contentAnimation}
                               className="flex flex-1 flex-row h-full"
                            >
                              <motion.div variants={childAnimation}>
                                <TabsList className={stylesCSS['tabs-sidebar']}>
                                  <h4 className="w-full text-sm font-medium text-[#00000040] mb-4 p-4">Customise</h4>
                                  {Object.entries(optionsConfig).map(([categoryId, category]) => (
                                    <TabsTrigger 
                                      key={categoryId}
                                      value={categoryId} 
                                      className={stylesCSS['tab-trigger']}
                                    >
                                      <Icon variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} size={20} />
                                      <h5 className={stylesCSS['tab-label']}>{category.label}</h5>
                                      <span className={stylesCSS['tab-category-count']}>{category.options.length}</span>
                                    </TabsTrigger>
                                  ))}
                                </TabsList>
                              </motion.div>

                              {Object.entries(optionsConfig).map(([categoryId, category]) => {
                                const Component = categoryComponentMap[categoryId as keyof typeof optionsConfig];
                                return (
                                  <TabsContent key={categoryId} value={categoryId} className={stylesCSS['tab-content']}>
                                    <motion.div variants={childAnimation}>
                                      <div className={stylesCSS['tab-header']}>
                                        <h3 className={stylesCSS['tab-title']}>{category.label}</h3>
                                        <p className={stylesCSS['tab-description']}>
                                          Choose {category.label.toLowerCase()} that matches your professional style and brand.
                                        </p>
                                      </div>
                                      {activeTab === categoryId && (
                                        <Component photographyStyle={style.id as StylePhotographyStyle} />
                                      )}
                                    </motion.div>
                                  </TabsContent>
                                );
                              })}
                            </motion.div>
                          </Tabs>
                        </div>

                        {/* Footer with selected options and add button */}
                        <motion.div 
                          className="flex items-center justify-between p-6 border-t bg-white"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.4, 
                            ease: [0.21, 1, 0.32, 1],
                            delay: 0.3 
                          }}
                        >
                          <div className="flex items-center gap-6">
                            {Object.entries(optionsConfig).map(([categoryId, category]) => {
                              const isActive = activeTab === categoryId;
                              const selectedOption = (() => {
                                switch (categoryId) {
                                  case 'background':
                                    return settings.background;
                                  case 'clothing':
                                    return settings.outfit;
                                  case 'clothingColor':
                                    return settings.outfitColor;
                                  default:
                                    return undefined;
                                }
                              })();
                              const selectedOptionData = category.options.find(opt => opt.id === selectedOption) as CategoryOption | undefined;
                              
                              return (
                                <button 
                                  key={categoryId}
                                  onClick={() => handleFooterButtonClick(categoryId)}
                                  data-state={isActive ? 'active' : 'inactive'}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <div className={stylesCSS['footer-icon-button']}>
                                    {selectedOptionData && visitedTabs.has(categoryId) ? (
                                      categoryId === 'clothingColor' ? (
                                        <>
                                          <div 
                                            className={`${stylesCSS['footer-option-color']} ${stylesCSS['footer-option-swatch']}`} 
                                              style={{ 
                                                background: selectedOptionData.id === '#FFFFFF' 
                                                  ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)' 
                                                  : selectedOptionData.id 
                                              }}
                                            />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full border-1 border-[#00000030] border-dashed mix-blend-multiply"></div>
                                            <Icon 
                                              variant="check" 
                                              size={16} 
                                              className={`${stylesCSS['footer-option-check']} ${stylesCSS['footer-option-color-check']}`}
                                            />
                                          </>
                                      ) : isImageOption(selectedOptionData) ? (
                                        <>
                                          <Image
                                            src={getOptionsImage(selectedOptionData.imageUrl)}
                                            alt={selectedOptionData.label}
                                            fill
                                            className={`${stylesCSS['footer-option-image']} ${stylesCSS['footer-option-swatch']}`}
                                          />
                                          <Icon 
                                            variant="check" 
                                            size={16} 
                                            className={stylesCSS['footer-option-check']} 
                                          />
                                        </>
                                      ) : (
                                        <Icon 
                                          variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} 
                                          size={30} 
                                          className={`${stylesCSS['footer-option-icon']} ${stylesCSS['footer-option-swatch']}`}
                                        />
                                      )
                                    ) : (
                                      <Icon 
                                        variant={categoryIconMap[categoryId as keyof typeof optionsConfig]} 
                                        size={30} 
                                        className={`${stylesCSS['footer-option-icon']} ${stylesCSS['footer-option-swatch']}`}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col items-start text-[12px]">
                                    <span className="text-[#00000060] font-light">{category.label}</span>
                                    <span className="text-[#000000]">
                                      {selectedOptionData && visitedTabs.has(categoryId) 
                                        ? selectedOptionData.label 
                                        : "Not selected"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <Button 
                            onClick={() => {
                              // Find first unselected option
                              const unselectedOption = Object.entries(optionsConfig).find(([categoryId]) => {
                                const selectedOption = (() => {
                                  switch (categoryId) {
                                    case 'background':
                                      return settings.background;
                                    case 'clothing':
                                      return settings.outfit;
                                    case 'clothingColor':
                                      return settings.outfitColor;
                                    default:
                                      return undefined;
                                  }
                                })();
                                return !selectedOption || !visitedTabs.has(categoryId);
                              });

                              if (unselectedOption) {
                                // Navigate to first unselected option
                                handleTabChange(unselectedOption[0]);
                              } else {
                                // All options selected, add to shoot
                                handleAddToShoot(style);
                              }
                            }}
                            variant={Object.entries(optionsConfig).some(([categoryId]) => {
                              const selectedOption = (() => {
                                switch (categoryId) {
                                  case 'background':
                                    return settings.background;
                                  case 'clothing':
                                    return settings.outfit;
                                  case 'clothingColor':
                                    return settings.outfitColor;
                                  default:
                                    return undefined;
                                }
                              })();
                              return !selectedOption || !visitedTabs.has(categoryId);
                            }) ? 'secondary' : 'primary'}
                            loading={isSaving}
                          >
                            {isSaving ? 'Adding to Shoot...' : (
                              Object.entries(optionsConfig).some(([categoryId]) => {
                                const selectedOption = (() => {
                                  switch (categoryId) {
                                    case 'background':
                                      return settings.background;
                                    case 'clothing':
                                      return settings.outfit;
                                    case 'clothingColor':
                                      return settings.outfitColor;
                                    default:
                                      return undefined;
                                  }
                                })();
                                return !selectedOption || !visitedTabs.has(categoryId);
                              }) ? 'Next' : 'Add to Shoot'
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="style-overview"
                        className={cn(
                          stylesCSS.slideCard,
                          "flex flex-col overflow-hidden transition-all duration-500 select-none h-full bg-[#F0F9F7]",
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
                        <div className="p-8">
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
                                variant="clothingColor"
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