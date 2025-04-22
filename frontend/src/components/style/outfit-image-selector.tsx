'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleOutfit, StylePhotographyStyle } from '@/lib/types'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };
import { OptionsCarousel } from './options-carousel'

interface OutfitImageSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

export function OutfitImageSelector({ photographyStyle }: OutfitImageSelectorProps) {
  const { settings, setOutfit } = useStyleStore();

  // Find the current style configuration
  const currentStyleConfig = stylesConfig.find(style => style.id === photographyStyle);

  // Get the list of available outfit IDs for the current style
  const availableClothingIds = currentStyleConfig?.availableClothing || [];

  // Filter the master list of outfits based on availability
  const filteredOutfitOptions = optionsConfig.clothing.options.filter(option => 
    availableClothingIds.includes(option.id)
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
    <OptionsCarousel
      options={filteredOutfitOptions}
      value={settings.outfit}
      onChange={(value) => setOutfit(value as StyleOutfit)}
    />
  );
} 