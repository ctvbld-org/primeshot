'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleOutfit, StylePhotographyStyle } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };

interface OutfitImageSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

export function OutfitImageSelector({ photographyStyle }: OutfitImageSelectorProps) {
  const { settings, setOutfit } = useStyleStore();

  // Find the current style configuration
  const currentStyleConfig = stylesConfig.find(style => style.id === photographyStyle);

  // Get the list of available outfit IDs for the current style
  const availableOutfitIds = currentStyleConfig?.availableOutfits || [];

  // Filter the master list of outfits based on availability
  const filteredOutfitOptions = optionsConfig.outfits.filter(option => 
    availableOutfitIds.includes(option.id)
  );

  // Effect to reset selection if current choice becomes invalid
  React.useEffect(() => {
    const needsUpdate = filteredOutfitOptions.length > 0 && 
                       !filteredOutfitOptions.some(opt => opt.id === settings.outfit);
    
    if (needsUpdate) {
      const defaultOption = filteredOutfitOptions[0].id as StyleOutfit;
      if (defaultOption !== settings.outfit) {
        setOutfit(defaultOption);
      }
    }
  }, [photographyStyle]); // Only run when photography style changes

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>;
  }

  if (filteredOutfitOptions.length === 0) {
    return <div>No outfit options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.outfit}
      onValueChange={(value) => setOutfit(value as StyleOutfit)}
      className="flex overflow-x-auto pb-4 -mx-2 px-2 gap-4 hide-scrollbar"
    >
      {filteredOutfitOptions.map((option) => (
        <div key={option.id} className="flex-none">
          <RadioGroupItem
            value={option.id}
            id={`outfit-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`outfit-${option.id}`}
            className={cn(
              "block w-[160px] rounded-xl border-2 border-muted bg-popover hover:bg-accent/5 cursor-pointer transition-colors",
              "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            )}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg">
              <Image
                src={getOptionsImage(option.imageUrl)} 
                alt={option.label}
                fill
                sizes="160px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <div className="p-2">
              <p className="text-sm font-medium text-center">{option.label}</p>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
} 