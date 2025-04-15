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
    if (filteredColorOptions.length > 0 && 
        !filteredColorOptions.some(opt => opt.id === settings.outfitColor)) {
      setOutfitColor(filteredColorOptions[0].id as StyleOutfitColor);
    }
  }, [photographyStyle, settings.outfitColor, setOutfitColor, filteredColorOptions]);

  if (!currentStyleConfig) {
    return <div>Error: Invalid photography style selected.</div>;
  }

  if (filteredColorOptions.length === 0) {
    return <div>No outfit color options available for {photographyStyle} style.</div>;
  }

  return (
    <TooltipProvider>
      <RadioGroup
        value={settings.outfitColor}
        onValueChange={(value) => setOutfitColor(value as StyleOutfitColor)}
        className="flex flex-wrap gap-3"
      >
        {filteredColorOptions.map((option) => (
          <Tooltip key={option.id} delayDuration={100}>
            <TooltipTrigger asChild>
              <div> 
                <RadioGroupItem
                  value={option.id}
                  id={`color-${option.id.replace('#', '')}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`color-${option.id.replace('#', '')}`}
                  className={cn(
                    "block h-10 w-10 rounded-full border-2 border-muted cursor-pointer",
                    "peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2 peer-data-[state=checked]:ring-primary"
                  )}
                  style={{ backgroundColor: option.id }} // Use the ID (hex code) directly
                  aria-label={option.label}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{option.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </RadioGroup>
    </TooltipProvider>
  );
} 