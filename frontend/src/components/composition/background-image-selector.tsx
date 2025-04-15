'use client'

import React from 'react'
import { useCompositionStore } from '@/store/composition'
import { CompositionBackground, CompositionPhotographyStyle } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { cn } from '@/lib/utils'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };

interface BackgroundImageSelectorProps {
  photographyStyle: CompositionPhotographyStyle;
}

export function BackgroundImageSelector({ photographyStyle }: BackgroundImageSelectorProps) {
  const { settings, setBackground } = useCompositionStore();

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
    if (filteredBackgroundOptions.length > 0 && 
        !filteredBackgroundOptions.some(opt => opt.id === settings.background)) {
      setBackground(filteredBackgroundOptions[0].id as CompositionBackground);
    }
    // Only run this effect if the available options change (i.e., photographyStyle changes)
  }, [photographyStyle, settings.background, setBackground, filteredBackgroundOptions]); 

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>; // Or some other error handling
  }

  if (filteredBackgroundOptions.length === 0) {
    return <div>No background options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.background}
      onValueChange={(value) => setBackground(value as CompositionBackground)}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {filteredBackgroundOptions.map((option) => (
        <div key={option.id}>
          <RadioGroupItem
            value={option.id}
            id={`bg-${option.id}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`bg-${option.id}`}
            className={cn(
              "block rounded-lg border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground cursor-pointer",
              "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            )}
          >
            <Card className="overflow-hidden border-none shadow-none">
              <CardContent className="p-0">
                <div className="relative aspect-video w-full">
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