'use client'

import React, { useEffect } from 'react'
import { useStyleStore } from '@/store/style'
import { StyleBackground, StylePhotographyStyle } from '@/lib/types'
import { OptionsCarousel } from './options-carousel'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'

interface BackgroundImageSelectorProps {
  photographyStyle: StylePhotographyStyle;
  isCard?: boolean;
}

// Type for the OptionsCarousel component
interface CarouselOption {
  id: string;
  label: string;
  imageUrl: string;
}

export function BackgroundImageSelector({ photographyStyle, isCard }: BackgroundImageSelectorProps) {
  const store = useStyleStore(photographyStyle)
  const settings = store((state) => state.settings)
  const setBackground = store((state) => state.setBackground)

  // Query for styles and background options using custom hooks
  const { data: styles, isLoading: isLoadingStyles, error: stylesError } = useStyleConfigs();
  const { data: backgroundOptions, isLoading: isLoadingBackground, error: backgroundError } = useOption('background');

  // Find the current style configuration
  const currentStyleConfig = styles?.find(style => style.id === photographyStyle);

  // Get the list of available background IDs for the current style
  const availableBackgroundIds = currentStyleConfig?.available_backgrounds || [];

  // Filter and transform the background options based on availability
  const filteredBackgroundOptions: CarouselOption[] = (backgroundOptions?.options || [])
    .filter(option => availableBackgroundIds.includes(option.id))
    .map(option => ({
      id: option.id,
      label: option.label,
      imageUrl: option.imageUrl ? getOptionsImage(option.imageUrl) : ''
    }));

  const isLoading = isLoadingStyles || isLoadingBackground;
  const error = stylesError || backgroundError;

  // Effect to reset selection if current choice becomes invalid
  useEffect(() => {
    const needsUpdate = filteredBackgroundOptions.length > 0 && 
                       !filteredBackgroundOptions.some(opt => opt.id === settings.background);
    
    if (needsUpdate) {
      const defaultOption = filteredBackgroundOptions[0].id as StyleBackground;
      if (defaultOption !== settings.background) {
        setBackground(defaultOption);
      }
    }
  }, [photographyStyle, filteredBackgroundOptions, settings.background, setBackground]);

  if (isLoading) {
    return <div className="p-4">Loading background options...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load options'}</div>;
  }

  if (!currentStyleConfig) {
    return <div className="p-4 text-red-500">Error: Invalid photography style selected.</div>;
  }

  if (filteredBackgroundOptions.length === 0) {
    return <div className="p-4">No background options available for {photographyStyle} style.</div>;
  }
  
  return (
    <OptionsCarousel
      options={filteredBackgroundOptions}
      value={settings.background}
      onChange={(value) => setBackground(value as StyleBackground)}
      forceMobile={isCard}
    />
  );
} 