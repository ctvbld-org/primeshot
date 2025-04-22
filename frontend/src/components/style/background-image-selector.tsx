'use client'

import React from 'react'
import { useStyleStore } from '@/store/style'
import { StyleBackground, StylePhotographyStyle } from '@/lib/types'
// Import configuration files
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };
import optionsConfig from '@/lib/config/options.json' assert { type: "json" };
import { OptionsCarousel } from './options-carousel'

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
  const filteredBackgroundOptions = optionsConfig.background.options.filter(option => 
    availableBackgroundIds.includes(option.id)
  );

  // Effect to reset selection if current choice becomes invalid
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
    return <div>Error: Invalid photography style selected.</div>;
  }

  if (filteredBackgroundOptions.length === 0) {
    return <div>No background options available for {photographyStyle} style.</div>;
  }

  return (
    <OptionsCarousel
      options={filteredBackgroundOptions}
      value={settings.background}
      onChange={(value) => setBackground(value as StyleBackground)}
    />
  );
} 