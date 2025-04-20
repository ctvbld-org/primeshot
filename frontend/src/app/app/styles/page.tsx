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
import { Camera, Shirt, Palette } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { BackgroundImageSelector } from '@/components/style/background-image-selector'
import { OutfitImageSelector } from '@/components/style/outfit-image-selector'
import { OutfitColorSelector } from '@/components/style/outfit-color-selector'
import { FlipCard } from '@/components/style/flip-card'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { saveStyle } from '@/lib/api/styles'
import { getOrCreateDraftOrder } from '@/lib/api/orders'
import { ensureUserProgress } from '@/lib/api/progress'
import { useStyleStore } from '@/store/style'
import { motion } from 'framer-motion'

// Create a Zod enum from the Gender type
const GenderEnum = z.enum(['male', 'female'] as const) satisfies z.ZodType<Gender>;

// Define the validation schema
const StyleConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
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

export default function Page() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { settings } = useStyleStore()
  const [isSaving, setIsSaving] = useState(false)
  const { gender, isLoading: isGenderLoading } = useUserGender();
  const filteredStyles = useGenderFilter(photographyStyleOptions, gender || undefined);
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null)
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: 0,
    align: 'center',
    containScroll: false
  })
  
  useEffect(() => {
    if (emblaApi) {
      let lastSelectedIndex = emblaApi.selectedScrollSnap();
      
      emblaApi.on('select', () => {
        const currentIndex = emblaApi.selectedScrollSnap();
        // Only reset flip state if we actually changed slides
        if (currentIndex !== lastSelectedIndex) {
          setFlippedCardIndex(null);
          lastSelectedIndex = currentIndex;
        }
        setSelectedIndex(currentIndex);
      })
      
      emblaApi.reInit()
    }
  }, [emblaApi])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
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
    <div className="wrapper flex flex-col">
      <motion.div 
        className="flex-1 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="w-full mx-auto" ref={emblaRef}>
          <div className="flex gap-10 touch-pan-y">
            {stylesWithImages.map((style, index) => (
              <div 
                key={style.id} 
                className="flex-[0_0_70%] min-w-0 relative transition-all duration-300"
              >
                <FlipCard
                  isFlipped={flippedCardIndex === index}
                  className="cursor-default"
                  frontContent={
                    <div 
                      className={cn(
                        "bg-white rounded-3xl overflow-hidden transition-all duration-300 select-none h-full",
                        selectedIndex === index 
                          ? "opacity-100 scale-100 border-[6px] border-accent" 
                          : "opacity-10 scale-[0.97] border-none border-transparent"
                      )}
                    >
                      {/* Image Strip */}
                      <div className="flex h-48 w-full">
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
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h2 className="text-5xl font-light text-gray-400">Style</h2>
                            <h3 className="text-5xl font-bold text-black">{style.name}</h3>
                          </div>
                          <Button 
                            variant="outline"
                            className="rounded-full px-6"
                            onClick={() => setFlippedCardIndex(index)}
                          >
                            Customise
                          </Button>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-lg mb-8">
                          {style.description}
                        </p>

                        {/* Style Details */}
                        <div className="flex items-center gap-12">
                          <div className="flex items-center gap-3">
                            <Camera className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Backgrounds</p>
                              <p className="text-lg font-semibold">{style.availableBackgrounds.length} options</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shirt className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Outfits</p>
                              <p className="text-lg font-semibold">{style.availableOutfits.length} options</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Palette className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Colors</p>
                              <p className="text-lg font-semibold">{style.availableOutfitColors.length} options</p>
                            </div>
                          </div>
                        </div>

                        {/* Tagline */}
                        <div className="mt-8 border-t pt-6">
                          <p className="text-xl font-semibold">Polished.</p>
                          <p className="text-xl font-semibold">Professional.</p>
                          <p className="text-xl font-semibold">Powerful.</p>
                        </div>
                      </div>
                    </div>
                  }
                  backContent={
                    <div className={cn(
                      "bg-white rounded-3xl overflow-hidden transition-all duration-300 select-none h-full",
                      selectedIndex === index 
                        ? "opacity-100 scale-100 border-[6px] border-accent" 
                        : "opacity-10 scale-[0.97] border-[6px] border-transparent"
                    )}>
                      <div className="h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setFlippedCardIndex(null)}
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

                        {/* Content */}
                        <div className="p-6 space-y-8">
                          <section>
                            <h3 className="text-gray-500 mb-4">Background</h3>
                            <BackgroundImageSelector photographyStyle={style.id as StylePhotographyStyle} />
                          </section>

                          <section>
                            <h3 className="text-gray-500 mb-4">Clothing Color</h3>
                            <OutfitColorSelector photographyStyle={style.id as StylePhotographyStyle} />
                          </section>

                          <section>
                            <h3 className="text-gray-500 mb-4">Clothing</h3>
                            <OutfitImageSelector photographyStyle={style.id as StylePhotographyStyle} />
                          </section>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8">
        <button
          onClick={scrollPrev}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev.
        </button>
        <button
          onClick={scrollNext}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
} 