'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleBackground, StylePhotographyStyle } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getOptionsImage } from '@/lib/utils/get-options-image'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };

interface BackgroundImageSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

export function BackgroundImageSelector({ photographyStyle }: BackgroundImageSelectorProps) {
  const { settings, setBackground } = useStyleStore();

  // Find the current style configuration
  const currentStyleConfig = stylesConfig.find(style => style.id === photographyStyle);

  // Get the list of available background IDs for the current style
  const availableBackgroundIds = currentStyleConfig?.availableBackgrounds || [];

  // Filter the master list of backgrounds based on availability
  const filteredBackgroundOptions = optionsConfig.backgrounds.filter(option => 
    availableBackgroundIds.includes(option.id)
  );

  // Handle cases where the currently selected background in the store
  // might not be available for the *newly selected* style.
  // If the stored background isn't available, select the first available one.
  React.useEffect(() => {
    const needsUpdate = filteredBackgroundOptions.length > 0 && 
                       !filteredBackgroundOptions.some(opt => opt.id === settings.background);
    
    if (needsUpdate) {
      const defaultOption = filteredBackgroundOptions[0].id as StyleBackground;
      if (defaultOption !== settings.background) {
        setBackground(defaultOption);
      }
    }
  }, [photographyStyle]); // Only run when photography style changes

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>; // Or some other error handling
  }

  if (filteredBackgroundOptions.length === 0) {
    return <div>No background options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.background}
      onValueChange={(value) => setBackground(value as StyleBackground)}
      className="flex overflow-x-auto pb-4 -mx-2 px-2 gap-4 hide-scrollbar"
    >
      {filteredBackgroundOptions.map((option) => (
        <div key={option.id} className="flex-none">
          <RadioGroupItem
            value={option.id}
            id={`bg-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`bg-${option.id}`}
            className={cn(
              "block w-[200px] rounded-xl border-2 border-muted bg-popover hover:bg-accent/5 cursor-pointer transition-colors",
              "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            )}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
              <Image
                src={getOptionsImage(option.imageUrl)} 
                alt={option.label}
                fill
                sizes="200px"
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