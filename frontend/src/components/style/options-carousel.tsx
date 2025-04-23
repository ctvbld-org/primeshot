'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { Icon } from '@/components/icons/icon'
import useEmblaCarousel from 'embla-carousel-react'
import styles from './options-carousel.module.css'

interface Option {
  id: string
  label: string
  imageUrl: string
}

interface OptionsCarouselProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export function OptionsCarousel({ 
  options,
  value,
  onChange
}: OptionsCarouselProps) {
  const initialIndex = options.findIndex(opt => opt.id === value);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 960);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  const scrollPrev = React.useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = React.useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const handleOptionChange = React.useCallback((newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
      setSelectedOption(newValue);
      
      const selectedIndex = options.findIndex(opt => opt.id === newValue);
      if (selectedIndex !== -1 && emblaApi) {
        //emblaApi.scrollTo(selectedIndex);
      }
    }
  }, [value, onChange, options, emblaApi]);

  const handleOptionClick = (optionId: string) => {
    const radioGroup = document.querySelector('[role="radiogroup"]') as HTMLElement;
    if (radioGroup) {
      // radioGroup.style.transition = 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)';
      // radioGroup.addEventListener('transitionend', () => {
      //   radioGroup.style.transition = '';
      // }, { once: true });
    }
  };

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const updateSelection = React.useCallback(() => {
    if (!emblaApi) return;
    
    const selectedIndex = emblaApi.selectedScrollSnap();
    const visibleSlides = emblaApi.slidesInView();
    
    if (isMobile) {
      // On mobile, select the centered slide
      const option = options[selectedIndex];
      if (option && option.id !== value) {
        handleOptionChange(option.id);
      }
    } else {
      // On desktop, keep the original logic
      if (selectedIndex === 0) {
        const option = options[0];
        if (option && option.id !== value) {
          handleOptionChange(option.id);
        }
      } else if (visibleSlides.length > 1) {
        const secondVisibleSlide = visibleSlides[1];
        const option = options[secondVisibleSlide];
        if (option && option.id !== value) {
          handleOptionChange(option.id);
        }
      }
    }
  }, [emblaApi, options, handleOptionChange, value, isMobile]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('settle', updateSelection);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('settle', updateSelection);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect, updateSelection]);

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
    <div className={styles.container}>      
      <div className={styles['carousel-container']}>
        <div className={styles['selection-highlight']} />
        <div ref={emblaRef}>
          <RadioGroup
            value={value}
            onValueChange={handleOptionChange}
            className={styles['options-group']}
          >
            {options.map((option) => (
              <div key={option.id} className={styles['option-item']}>
                <RadioGroupItem
                  value={option.id}
                  id={`option-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`option-${option.id}`}
                  className={styles['option-label']}
                  onClick={() => handleOptionClick(option.id)}
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
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={cn(styles['nav-button'], styles['prev-button'])}
        >
          <Icon variant="arrowLeft" size={16} />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(styles['nav-button'], styles['next-button'])}
        >
          <Icon variant="arrowRight" size={16} />
        </button>
      </div>

      {/* Selected Option Label */}
      {selectedOption && (
        <div className={styles['selected-label-container']}>
          <p className={styles['selected-label']}>
            {options.find(opt => opt.id === selectedOption)?.label}
          </p>
        </div>
      )}
    </div>
  );
} 