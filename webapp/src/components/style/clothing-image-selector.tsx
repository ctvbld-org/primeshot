'use client'

import React, { useEffect } from 'react'
import { useStyleStore } from '@/store/style'
import { StyleClothing, StylePhotographyStyle } from '@/lib/types'
import { OptionsCarousel } from './options-carousel'
import { getOptionsImage } from '@/lib/utils/get-options-image'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'
import { useTranslatedOption } from '@/hooks/useTranslatedOption'
import { useValidStyleOptions } from '@/lib/utils/style-validation'
import { useTranslation } from 'react-i18next'

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
  const store = useStyleStore(photographyStyle)
  const settings = store((state) => state.settings)
  const setClothing = store((state) => state.setClothing)
  const { data: validOptions, isLoading: isLoadingValidOptions } = useValidStyleOptions();
  const { t } = useTranslation("common");
  // Query for styles and clothing options using custom hooks
  const { data: styles, isLoading: isLoadingStyles, error: stylesError } = useStyleConfigs();
  const { data: rawClothingOptions, isLoading: isLoadingClothing, error: clothingError } = useOption('clothing');
  const clothingOptions = useTranslatedOption(rawClothingOptions);

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

  const isLoading = isLoadingStyles || isLoadingClothing || isLoadingValidOptions;
  const error = stylesError || clothingError;

  // Effect to reset selection if current choice becomes invalid
  useEffect(() => {
    if (!validOptions) return;
    const needsUpdate = filteredClothingOptions.length > 0 && 
                       !filteredClothingOptions.some(opt => opt.id === settings.clothing);
    
    if (needsUpdate) {
      const defaultOption = filteredClothingOptions[0].id as StyleClothing;
      if (defaultOption !== settings.clothing) {
        setClothing(defaultOption, validOptions);
      }
    }
  }, [photographyStyle, filteredClothingOptions, settings.clothing, setClothing, validOptions]);

  if (isLoading) {
    return <div className="p-4">{t("loading")}</div>;
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
      onChange={(value) => validOptions && setClothing(value as StyleClothing, validOptions)}
      forceMobile={isCard}
    />
  );
} 