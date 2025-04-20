'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleOutfitColor, StylePhotographyStyle } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

  // Get the list of available color IDs (hex codes) for the current style
  const availableColorIds = currentStyleConfig?.availableOutfitColors || [];

  // Filter the master list of colors based on availability
  const filteredColorOptions = optionsConfig.outfitColors.filter(option => 
    availableColorIds.includes(option.id)
  );

  // Effect to reset selection if current choice becomes invalid
  React.useEffect(() => {
    const needsUpdate = filteredColorOptions.length > 0 && 
                       !filteredColorOptions.some(opt => opt.id === settings.outfitColor);
    
    if (needsUpdate) {
      const defaultOption = filteredColorOptions[0].id as StyleOutfitColor;
      if (defaultOption !== settings.outfitColor) {
        setOutfitColor(defaultOption);
      }
    }
  }, [photographyStyle]); // Only run when photography style changes

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>;
  }

  if (filteredColorOptions.length === 0) {
    return <div>No outfit color options available for {photographyStyle} style.</div>;
  }

  return (
    <RadioGroup
      value={settings.outfitColor}
      onValueChange={(value) => setOutfitColor(value as StyleOutfitColor)}
      className="flex gap-3"
    >
      {filteredColorOptions.map((option) => (
        <div key={option.id}> 
          <RadioGroupItem
            value={option.id}
            id={`color-${option.id.replace('#', '')}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`color-${option.id.replace('#', '')}`}
            className={cn(
              "block h-12 w-12 rounded-full border-2 border-muted cursor-pointer transition-all",
              "hover:scale-110",
              "peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2 peer-data-[state=checked]:ring-primary"
            )}
            style={{ backgroundColor: option.id }}
            aria-label={option.label}
          />
        </div>
      ))}
    </RadioGroup>
  );
} 