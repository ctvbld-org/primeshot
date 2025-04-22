'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleOutfitColor, StylePhotographyStyle } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };

interface OutfitColorSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

export function OutfitColorSelector({ photographyStyle }: OutfitColorSelectorProps) {
  const { settings, setOutfitColor } = useStyleStore();

  // Find the current style configuration
  const currentStyleConfig = stylesConfig.find(style => style.id === photographyStyle);

  // Get the list of available outfit color IDs for the current style
  const availableClothingColorIds = currentStyleConfig?.availableClothingColor || [];

  // Filter the master list of outfit colors based on availability
  const filteredOutfitColorOptions = optionsConfig.clothingColor.options.filter(option => 
    availableClothingColorIds.includes(option.id)
  );

  // Effect to reset selection if current choice becomes invalid
  React.useEffect(() => {
    const needsUpdate = filteredOutfitColorOptions.length > 0 && 
                       !filteredOutfitColorOptions.some(opt => opt.id === settings.outfitColor);
    
    if (needsUpdate) {
      const defaultOption = filteredOutfitColorOptions[0].id as StyleOutfitColor;
      if (defaultOption !== settings.outfitColor) {
        setOutfitColor(defaultOption);
      }
    }
  }, [photographyStyle]); // Only run when photography style changes

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>;
  }

  if (filteredOutfitColorOptions.length === 0) {
    return <div>No outfit color options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.outfitColor}
      onValueChange={(value) => setOutfitColor(value as StyleOutfitColor)}
      className="flex flex-wrap p-4 gap-2"
    >
      {filteredOutfitColorOptions.map((option) => (
        <div key={option.id} className="flex-none">
          <RadioGroupItem
            value={option.id}
            id={`outfit-color-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`outfit-color-${option.id}`}
            className={cn(
              "block w-[72px] h-[72px] rounded-full border-2 border-white  bg-popover hover:bg-accent/5 cursor-pointer transition-colors box-content",
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