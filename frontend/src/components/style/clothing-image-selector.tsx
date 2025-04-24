'use client'

import React, { useEffect } from 'react'
import { useStyleStore } from '@/store/style'
import { StyleClothing, StylePhotographyStyle } from '@/lib/types'
import { OptionsCarousel } from './options-carousel'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'

interface ClothingImageSelectorProps {
  photographyStyle: StylePhotographyStyle;
  isCard?: boolean;
}

// Type for the OptionsCarousel component
interface CarouselOption {
  id: string;
  label: string;
  imageUrl: string;
}

export function ClothingImageSelector({ photographyStyle, isCard }: ClothingImageSelectorProps) {
  const { settings, setClothing } = useStyleStore();

  // Query for styles and clothing options using custom hooks
  const { data: styles, isLoading: isLoadingStyles, error: stylesError } = useStyleConfigs();
  const { data: clothingOptions, isLoading: isLoadingClothing, error: clothingError } = useOption('clothing');

  // Find the current style configuration
  const currentStyleConfig = styles?.find(style => style.id === photographyStyle);

  // Get the list of available outfit IDs for the current style
  const availableClothingIds = currentStyleConfig?.available_clothing || [];

  // Filter and transform the clothing options based on availability
  const filteredClothingOptions: CarouselOption[] = (clothingOptions?.options || [])
    .filter(option => availableClothingIds.includes(option.id))
    .map(option => ({
      id: option.id,
      label: option.label,
      imageUrl: option.imageUrl ? getOptionsImage(option.imageUrl) : ''
    }));

  const isLoading = isLoadingStyles || isLoadingClothing;
  const error = stylesError || clothingError;

  // Effect to reset selection if current choice becomes invalid
  useEffect(() => {
    const needsUpdate = filteredClothingOptions.length > 0 && 
                       !filteredClothingOptions.some(opt => opt.id === settings.clothing);
    
    if (needsUpdate) {
      const defaultOption = filteredClothingOptions[0].id as StyleClothing;
      if (defaultOption !== settings.clothing) {
        setClothing(defaultOption);
      }
    }
  }, [photographyStyle, filteredClothingOptions, settings.clothing, setClothing]);

  if (isLoading) {
    return <div className="p-4">Loading clothing options...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error instanceof Error ? error.message : 'Failed to load options'}</div>;
  }

  if (!currentStyleConfig) {
    return <div className="p-4 text-red-500">Error: Invalid photography style selected.</div>;
  }

  if (filteredClothingOptions.length === 0) {
    return <div className="p-4">No clothing options available for {photographyStyle} style.</div>;
  }

  return (
    <OptionsCarousel
      options={filteredClothingOptions}
      value={settings.clothing}
      onChange={(value) => setClothing(value as StyleClothing)}
      forceMobile={isCard}
    />
  );
} 