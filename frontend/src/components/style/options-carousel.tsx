'use client'

import React from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { Icon } from '@/components/icons/icon'
import useEmblaCarousel from 'embla-carousel-react'

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', // Always align to the start
    dragFree: false,
    skipSnaps: true,
    containScroll: false,
    duration: 15
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
      
      // Find the index of the selected option
      const selectedIndex = options.findIndex(opt => opt.id === newValue);
      if (selectedIndex !== -1 && emblaApi) {
        emblaApi.scrollTo(selectedIndex);
      }
    }
  }, [value, onChange, options, emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const updateSelection = React.useCallback(() => {
    if (!emblaApi) return;
    
    const selectedIndex = emblaApi.selectedScrollSnap();
    const visibleSlides = emblaApi.slidesInView();
    
    // If we're at the start, select the first slide, otherwise select the second visible slide
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
  }, [emblaApi, options, handleOptionChange, value]);

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

  if (options.length === 0) {
    return <div>No options available.</div>;
  }

  return (
    <div className="space-y-4">      
      <div className="relative">
        <div className="absolute z-10 left-0 top-0 w-[232px] h-[232px] rounded-sm border-2 border-white shadow-[0_0_0_4px_#FFB45E] pointer-events-none"></div>
        <div ref={emblaRef}>
          <RadioGroup
            value={value}
            onValueChange={handleOptionChange}
            className="flex [&>*]:flex-[0_0_232px] gap-[0px]"
          >
            {options.map((option) => (
              <div key={option.id}>
                <RadioGroupItem
                  value={option.id}
                  id={`option-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`option-${option.id}`}
                  className={cn(
                    "block bg-popover hover:bg-accent/5 cursor-pointer transition-colors",
                    "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  )}
                >
                  <div className="relative aspect-square w-full overflow-hidden">
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
          className={cn(
            "absolute top-full right-[48px] translate-y-4 z-50 w-10 h-10 flex items-center justify-center",
            "bg-[#00000015] text-black rounded-full transition-all cursor-pointer",
            "disabled:opacity-40 disabled:cursor-not-allowed enabled:opacity-100 hover:not-disabled:bg-accent/15"
          )}
        >
          <Icon variant="arrowLeft" size={16} />
        </button>

        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={cn(
            "absolute top-full right-0 translate-y-4 z-50 w-10 h-10 flex items-center justify-center",
            "bg-[#00000015] text-black rounded-full transition-all cursor-pointer",
            "disabled:opacity-40 enabled:opacity-100 hover:bg-accent/15"
          )}
        >
          <Icon variant="arrowRight" size={16} />
        </button>
      </div>

      {/* Selected Option Label */}
      {selectedOption && (
        <div className="flex justify-center items-center max-w-[232px] h-10">
          <p className="text-center text-[12px] bg-[#00000015] px-3 py-1 text-black rounded-full">
            {options.find(opt => opt.id === selectedOption)?.label}
          </p>
        </div>
      )}
    </div>
  );
} 