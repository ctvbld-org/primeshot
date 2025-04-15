'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleOutfit, StylePhotographyStyle } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
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
    if (filteredOutfitOptions.length > 0 && 
        !filteredOutfitOptions.some(opt => opt.id === settings.outfit)) {
      setOutfit(filteredOutfitOptions[0].id as StyleOutfit);
    }
  }, [photographyStyle, settings.outfit, setOutfit, filteredOutfitOptions]);

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
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {filteredOutfitOptions.map((option) => (
        <div key={option.id}>
          <RadioGroupItem
            value={option.id}
            id={`outfit-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`outfit-${option.id}`}
            className={cn(
              "block rounded-lg border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground cursor-pointer",
              "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            )}
          >
            <Card className="overflow-hidden border-none shadow-none">
              <CardContent className="p-0">
                <div className="relative aspect-square w-full">
                  <Image
                    src={option.imageUrl} 
                    alt={option.label}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 peer-data-[state=checked]:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                <div className="p-2 text-center">
                  <p className="text-sm font-medium truncate">{option.label}</p>
                </div>
              </CardContent>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
} 