'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Style } from '@/lib/types'
import { StyleCard } from '@/components/style/style-card'
import { NewStyleCard } from '@/components/style/new-style-card'
import { getStyles, calculateHeadshots, handleStyleDeletion } from '@/lib/api/styles'
import { ShootFooter } from '@/components/shoot/shoot-footer'
import { PRICING } from '@/lib/constants/pricing'
import stylesCSS from './page.module.css'
import { motion } from 'framer-motion'
import { type CarouselApi } from "@/components/ui/carousel"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import React from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import { useHeadshotStore } from '@/store/headshot'
import { useUserProgress } from '@/lib/hooks/use-user-progress'

export default function StylesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { t } = useTranslation(['styles', 'common'])
  const [styles, setStyles] = useState<Style[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setCount] = useState(0)
  const [, setCurrent] = useState(0)
  
  // Add carousel API state
  const [api, setApi] = React.useState<CarouselApi>()
  
  // Replace showOverlay with activeEditId
  const [activeEditId, setActiveEditId] = useState<string | null>(null)
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(true)

  // Headshot calculation state
  const { headshotInfo, setHeadshotInfo } = useHeadshotStore()

  // Function to load styles
  const loadStyles = useCallback(async () => {
    if (!user) return;

    try {
      if (styles.length === 0) {
        setIsLoading(true);
      }
      
      const draftStyles = await getStyles(user.id, { status: 'draft' });
      setStyles(draftStyles);
      
      if (user) {
        try {
          const headshots = await calculateHeadshots(user.id);
          setHeadshotInfo(headshots);
        } catch (error) {
          console.error('Error calculating headshots:', error);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : t('errors.loadStyles'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, styles.length, t]);

  // Load styles on mount
  useEffect(() => {
    if (user) {
      loadStyles();
    }
  }, [user, loadStyles]);

  // Function to handle style deletion
  const handleDeleteStyle = async (styleId: string) => {
    if (!user) return;

    await handleStyleDeletion(
      styleId,
      user.id,
      () => setStyles((prevStyles) => prevStyles.filter((style) => style.id !== styleId)),
      {
        success: toast,
        error: (opts: { title: string; description: string }) => toast({ ...opts, variant: 'destructive' })
      }
    );
  };

  // Add carousel effect
  React.useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  return (
    <div className={stylesCSS.container}>
      <motion.div 
        className={`${stylesCSS['card-wrapper']} wrapper ${styles.length === 0 && stylesCSS['scrollable']}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {isLoading ? (
          <div className="text-center py-8">{t('loading', { ns: 'common' })}</div>
        ) : styles.length === 0 ? (
          <>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <NewStyleCard 
              className="h-[608px] max-h-[calc(100% - 120px)]" 
              onClick={() => router.push('/app/styles')}
            />
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
            <div className={stylesCSS['fake-card']}></div>
          </>
        ) : (
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              containScroll: false,
              dragFree: true,
              loop: false,
              watchDrag: isDraggingEnabled,
              breakpoints: {
                '(max-width: 600px)': {
                  dragFree: false,
                  align: "start",
                  slidesToScroll: 1
                }
              }
            }}
            plugins={[WheelGesturesPlugin()]}
            className={stylesCSS['carousel']}
            aria-label={t('carousel.label')}
            aria-roledescription="carousel" 
          >
            <CarouselContent>
              <CarouselItem 
                className={cn(
                  "basis-[386px] pl-6",
                  activeEditId && "disabled-card"
                )} 
                aria-label={t('newStyle.title')}
              >
                <NewStyleCard 
                  className="h-[98%] max-h-none" 
                  onClick={() => router.push('/app/styles')}
                />
              </CarouselItem>
              
              {styles.map((style) => (
                <CarouselItem 
                  key={style.id}
                  className={cn(
                    "basis-[386px] pl-6",
                    activeEditId === style.id ? "editing-card" : activeEditId ? "disabled-card" : ""
                  )}
                  aria-label={t('buttons.edit', { ns: 'common' })}
                >
                  <StyleCard
                    savedStyle={style}
                    headshotsPerStyle={headshotInfo.headshotsPerStyle}
                    onDelete={handleDeleteStyle}
                    onEdit={() => {
                      setActiveEditId(style.id);
                      setIsDraggingEnabled(false);
                    }}
                    onCloseEdit={() => {
                      setActiveEditId(null);
                      setIsDraggingEnabled(true);
                      loadStyles();
                    }}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious 
              className={`${stylesCSS['carousel-previous']}`}
              aria-label={t('buttons.previous', { ns: 'common' })}
            />
            <CarouselNext 
              className={`${stylesCSS['carousel-next']}`}
              aria-label={t('buttons.next', { ns: 'common' })}
            />
          </Carousel>
        )}
      </motion.div>
      <ShootFooter
        stylesCount={headshotInfo.styleCount}
        photosPerStyle={headshotInfo.headshotsPerStyle}
        basePrice={headshotInfo.price}
        extraStylesCount={
          headshotInfo.styleCount === 1 ? 2 :  // Individual -> Professional (2 extra)
          headshotInfo.styleCount <= 3 ? 3 :   // Professional -> Studio (3 extra)
          1                                     // Studio -> Studio + 1
        }
        totalPhotosWithExtra={
          headshotInfo.styleCount === 1 ? PRICING.professional.totalHeadshots :  // Individual -> Professional
          headshotInfo.styleCount <= 3 ? PRICING.studio.totalHeadshots :         // Professional -> Studio
          headshotInfo.totalHeadshots + PRICING.addon.headshots                  // Studio -> Studio + addon
        }
        upgradedPrice={
          headshotInfo.styleCount === 1 ? PRICING.professional.price / 100 :  // Individual -> Professional
          headshotInfo.styleCount <= 3 ? PRICING.studio.price / 100 :         // Professional -> Studio
          headshotInfo.price / 100 + PRICING.addon.price / 100               // Studio -> Studio + addon
        }
      />
    </div>
  )
} 