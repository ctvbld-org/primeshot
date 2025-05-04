'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { Icon } from '@/components/icons/icon'
import useEmblaCarousel from 'embla-carousel-react'
import styles from './options-carousel.module.css'
import { useCarouselContext } from '@/contexts/carousel-context'

interface Option {
  id: string
  label: string
  imageUrl: string
}

interface OptionsCarouselProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  forceMobile?: boolean
}

export const OptionsCarousel = React.memo(function OptionsCarouselComponent({
  options,
  value,
  onChange,
  forceMobile = false
}: OptionsCarouselProps) {
  const { setIsChangingSlide } = useCarouselContext();
  const initialIndex = options.findIndex(opt => opt.id === value);
  const [isMobile, setIsMobile] = React.useState(forceMobile);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(forceMobile || window.innerWidth < 960);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [forceMobile]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: isMobile ? 'center' : 'start',
    dragFree: false,
    skipSnaps: true,
    containScroll: false,
    duration: 15,
    startIndex: initialIndex > -1 ? initialIndex : 0
  });

  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(true);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(value);
 
  const scrollPrev = React.useCallback(() => {
    if (emblaApi) {
      setIsChangingSlide(true);
      emblaApi.scrollPrev();
    }
  }, [emblaApi, setIsChangingSlide]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) {
      setIsChangingSlide(true);
      emblaApi.scrollNext();
    }
  }, [emblaApi, setIsChangingSlide]);

  // Wrap onChange in useCallback to stabilize the reference if passed from parent
  const memoizedOnChange = React.useCallback(onChange, [onChange]);

  const handleOptionChange = React.useCallback((newValue: string) => {
    // Compare with selectedOption state, not the potentially stale value prop
    if (newValue !== selectedOption) {
      memoizedOnChange(newValue);
      setSelectedOption(newValue); // Update local state immediately
      
      const selectedIndex = options.findIndex(opt => opt.id === newValue);
      if (selectedIndex !== -1 && emblaApi) {
        // Scroll without triggering another change
         if (emblaApi.selectedScrollSnap() !== selectedIndex) {
           emblaApi.scrollTo(selectedIndex);
         }
      }
    }
  }, [selectedOption, memoizedOnChange, options, emblaApi]);

  const handleOptionClick = React.useCallback((newValue: string) => {
    const selectedIndex = options.findIndex(opt => opt.id === newValue);
 
    if (selectedIndex !== -1 && emblaApi) {
      // Scroll first, then trigger change after settle
      if (emblaApi.selectedScrollSnap() !== selectedIndex) {
         emblaApi.scrollTo(selectedIndex);
      }
      // Let the 'settle' event handle the state update via updateSelection
    }
    }, [emblaApi, options]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const updateSelection = React.useCallback(() => {
    if (!emblaApi) return;
    
    const selectedIndex = emblaApi.selectedScrollSnap();
    const option = options[selectedIndex];
    
    // Always update based on the settled slide index
    if (option && option.id !== selectedOption) {
      handleOptionChange(option.id); 
    }
   
  }, [emblaApi, options, selectedOption, handleOptionChange]);

  React.useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    // Start slide change
    const onPointerDown = () => {
      setIsChangingSlide(true);
    };

    const onScroll = () => {
      setIsChangingSlide(true);
    };

    // End slide change
    const onSettle = () => {
      setIsChangingSlide(false);
      updateSelection();
    };

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('pointerDown', onPointerDown);
    emblaApi.on('scroll', onScroll);
    emblaApi.on('settle', onSettle);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('pointerDown', onPointerDown);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onSettle);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, setIsChangingSlide, updateSelection]);

  // Sync local state if the external value prop changes
  React.useEffect(() => {
    if (value !== selectedOption) {
      setSelectedOption(value);
      const selectedIndex = options.findIndex(opt => opt.id === value);
      if (selectedIndex !== -1 && emblaApi && emblaApi.selectedScrollSnap() !== selectedIndex) {
        emblaApi.scrollTo(selectedIndex); 
      }
    }
  }, [value, selectedOption, options, emblaApi]);

  // Update carousel configuration when screen size changes
  React.useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit({ 
        align: isMobile ? 'center' : 'start',
        dragFree: false,
        skipSnaps: true,
        containScroll: false,
        duration: 15
      });
    }
  }, [emblaApi, isMobile]);

  if (options.length === 0) {
    return <div>No options available.</div>;
  }

  return (
    <div className={`${styles.container} ${forceMobile ? styles['mobile-styling'] : ''}`}>      
      <div className={styles['carousel-container']}>
        <div className={styles['selection-highlight']} />
        <div ref={emblaRef}>
          <div className={styles['options-group']}>
            {options.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  styles['option-item'],
                  selectedOption === option.id && styles['selected']
                )}
                onClick={() => handleOptionClick(option.id)}
                data-option-id={option.id}
                data-option-label={option.label}
                role="button"
                aria-selected={selectedOption === option.id}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionChange(option.id);
                  }
                }}
              >
                <div className={styles['image-container']}>
                  <Image
                    src={getOptionsImage(option.imageUrl)} 
                    alt={option.label}
                    fill
                    sizes="232px"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(styles['nav-button'], styles['prev-button'])}
          aria-label="Previous option"
        >
          <Icon variant="arrowLeft" size={16} />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(styles['nav-button'], styles['next-button'])}
          aria-label="Next option"
        >
          <Icon variant="arrowRight" size={16} />
        </button>
      </div>

      {/* Selected Option Label */}
      {selectedOption && (
        <div className={styles['selected-label-container']} aria-live="polite">
          <p className={styles['selected-label']}>
            {options.find(opt => opt.id === selectedOption)?.label}
          </p>
        </div>
      )}
    </div>
  );
}); 