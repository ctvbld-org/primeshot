'use client'

import React, { useEffect } from 'react'
import { useStyleStore } from '@/store/style'
import { StyleClothingColor, StylePhotographyStyle } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'

interface ClothingColorSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

interface ColorOption {
  id: string;
  label: string;
}

export function ClothingColorSelector({ photographyStyle }: ClothingColorSelectorProps) {
  const { settings, setClothingColor } = useStyleStore();

  // Query for styles and color options using custom hooks
  const { data: styles, isLoading: isLoadingStyles, error: stylesError } = useStyleConfigs();
  const { data: colorOptions, isLoading: isLoadingColors, error: colorsError } = useOption('clothingColor');

  const styleConfig = styles?.find(style => style.id === photographyStyle) || null;
  const isLoading = isLoadingStyles || isLoadingColors;
  const error = stylesError || colorsError;

  // Get the list of available outfit color IDs for the current style
  const availableClothingColorIds = styleConfig?.available_clothing_colors || [];

  // Filter the color options based on availability
  const filteredClothingColorOptions: ColorOption[] = (colorOptions?.options || [])
    .filter(option => availableClothingColorIds.includes(option.id));

  // Effect to reset selection if current choice becomes invalid
  useEffect(() => {
    const needsUpdate = filteredClothingColorOptions.length > 0 && 
                       !filteredClothingColorOptions.some(opt => opt.id === settings.clothingColor);
    
    if (needsUpdate) {
      const defaultOption = filteredClothingColorOptions[0].id as StyleClothingColor;
      if (defaultOption !== settings.clothingColor) {
        setClothingColor(defaultOption);
      }
    }
  }, [photographyStyle, filteredClothingColorOptions, settings.clothingColor, setClothingColor]);

  if (isLoading) return <div className="p-4">Loading color options...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load options'}</div>;
  if (!styleConfig) return <div className="p-4">Error: Invalid photography style selected.</div>;
  if (!colorOptions) return <div className="p-4">No color options available</div>;
  if (filteredClothingColorOptions.length === 0) {
    return <div className="p-4">No clothing color options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.clothingColor}
      onValueChange={(value) => setClothingColor(value as StyleClothingColor)}
      className="flex flex-wrap p-4 gap-2"
    >
      {filteredClothingColorOptions.map((option) => (
        <div key={option.id} className="flex-none">
          <RadioGroupItem
            value={option.id}
            id={`clothing-color-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`clothing-color-${option.id}`}
            className={cn(
              "block w-[72px] h-[72px] rounded-full border-2 border-white bg-popover hover:bg-accent/5 cursor-pointer transition-colors box-content",
              "peer-data-[state=checked]:shadow-[0_0_0_4px_#FFB45E] [&:has([data-state=checked])]:shadow-[0_0_0_4px_#FFB45E]"
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full">
              <div 
                className="w-full h-full" 
                style={{ 
                  background: option.id === '#FFFFFF' 
                    ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)' 
                    : option.id 
                }}
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62px] h-[62px] rounded-full border-1 border-[#00000030] border-dashed mix-blend-multiply" 
              />
            </div>
            <p className="sr-only">{option.label}</p>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
} 