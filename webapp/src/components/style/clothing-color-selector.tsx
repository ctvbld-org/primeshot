'use client'

import React, { useEffect } from 'react'
import { useStyleStore } from '@/store/style'
import { StyleClothingColor, StylePhotographyStyle } from '@/lib/types'
import { RadioGroup, RadioGroupItem } from '@primeshot/common/web/ui/radio-group'
import { Label } from '@primeshot/common/web/ui/label'
import { cn } from '@/lib/utils'
import { useStyleConfigs, useOption } from '@/hooks/useConfig'
import { useTranslatedOption } from '@/hooks/useTranslatedOption'
import cssStyles from './clothing-color-selector.module.css'
import { useValidStyleOptions } from '@/lib/utils/style-validation'

interface ClothingColorSelectorProps {
  photographyStyle: StylePhotographyStyle;
}

interface ColorOption {
  id: string;
  label: string;
}

interface StyleConfig {
  id: string;
  available_clothing_colors: string[];
}

export function ClothingColorSelector({ photographyStyle }: ClothingColorSelectorProps) {
  const store = useStyleStore(photographyStyle)
  const settings = store((state) => state.settings)
  const setClothingColor = store((state) => state.setClothingColor)
  const { data: validOptions, isLoading: isLoadingValidOptions } = useValidStyleOptions();

  // Query for styles and color options using custom hooks
  const { data: styleConfigs, isLoading: isLoadingStyles, error: stylesError } = useStyleConfigs();
  const { data: rawColorOptions, isLoading: isLoadingColors, error: colorsError } = useOption('clothingColor');
  const colorOptions = useTranslatedOption(rawColorOptions);

  const styleConfig = styleConfigs?.find((style: StyleConfig) => style.id === photographyStyle) || null;
  const isLoading = isLoadingStyles || isLoadingColors || isLoadingValidOptions;
  const error = stylesError || colorsError;

  // Get the list of available outfit color IDs for the current style
  const availableClothingColorIds = styleConfig?.available_clothing_colors || [];
  
  // Filter the color options based on availability
  const filteredClothingColorOptions: ColorOption[] = (colorOptions?.options || [])
    .filter(option => availableClothingColorIds.includes(option.id));

  // Effect to reset selection if current choice becomes invalid
  useEffect(() => {
    if (!validOptions) return;
    const needsUpdate = filteredClothingColorOptions.length > 0 && 
                       !filteredClothingColorOptions.some(opt => opt.id === settings.clothingColor);
    
    if (needsUpdate) {
      const defaultOption = filteredClothingColorOptions[0].id as StyleClothingColor;
      if (defaultOption !== settings.clothingColor) {
        setClothingColor(defaultOption, validOptions);
      }
    }
  }, [photographyStyle, filteredClothingColorOptions, settings.clothingColor, setClothingColor, validOptions]);

  if (isLoading) return <div className={cssStyles.loading}>Loading color options...</div>;
  if (error) return <div className={cssStyles.error}>Error: {error instanceof Error ? error.message : 'Failed to load options'}</div>;
  if (!styleConfig) return <div className={cssStyles.loading}>Error: Invalid photography style selected.</div>;
  if (!colorOptions) return <div className={cssStyles.loading}>No color options available</div>;
  if (filteredClothingColorOptions.length === 0) {
    return <div className={cssStyles.loading}>No clothing color options available for {photographyStyle} style.</div>;
  }

  return (
    <div className={cssStyles.clothingColorSection}>
      <RadioGroup
        value={settings.clothingColor}
        onValueChange={(value) => validOptions && setClothingColor(value as StyleClothingColor, validOptions)}
        className={cssStyles.colorOptionContainer}
      >
        {filteredClothingColorOptions.map((option) => (
          <div key={option.id} className={cssStyles.colorOption}>
            <RadioGroupItem
              value={option.id}
              id={`clothing-color-${option.id}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`clothing-color-${option.id}`}
              className={cn(cssStyles.label)}
            >
              <div className={cssStyles.colorSwatch}>
                <div 
                  className={cssStyles.colorInner}
                  style={{ 
                    background: option.id === '#FFFFFF' 
                      ? 'linear-gradient(153deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0.00) 83.33%), linear-gradient(0deg, #FFF 0%, #FFF 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.10) 100%)' 
                      : option.id 
                  }}
                />
                <div className={cssStyles.colorBorder} />
              </div>
              <p className={cssStyles.srOnly}>{option.label}</p>
            </Label>
          </div>
        ))}
      </RadioGroup>
      {settings.clothingColor && (
        <div className={cssStyles.selectedLabel}>
          <p className={cssStyles.selectedLabelText}>
            {filteredClothingColorOptions.find(opt => opt.id === settings.clothingColor)?.label}
          </p>
        </div>
      )}
    </div>
  );
} 