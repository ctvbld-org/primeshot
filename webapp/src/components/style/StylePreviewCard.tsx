'use client'

import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAppCdnUrl } from '@primeshot/common/lib/utils/cdn';
import { useStyleData } from '@primeshot/common';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { storeStyleSelections } from '@primeshot/common/lib/utils/style-storage';
import styles from './StylePreviewCard.module.css';
import { AspectRatio } from '@/lib/utils/parse-style-image-metadata';

interface StylePreviewCardProps {
  image: string;
  aspectRatio: AspectRatio;
  resolution: string;
  style: string;
  styleFormatted: string;
  scene: string;
  wardrobe: string;
  color: string;
  priority?: boolean;
  styleId?: string; // Style UUID for storing selections
  onGenerate?: () => void; // Callback to close dialog
}

export function StylePreviewCard({
  image,
  aspectRatio,
  resolution,
  style,
  styleFormatted,
  scene,
  wardrobe,
  color,
  priority = false,
  styleId,
  onGenerate
}: StylePreviewCardProps) {
  const { t, i18n } = useTranslation(['styles', 'common']);
  const { findSceneByValue, findWardrobeByValue, findColorByValue, scenesLoading, wardrobesLoading, colorsLoading } = useStyleData();
  
  // Helper to get translated label
  const getTranslatedLabel = <T extends { translations?: { [lang: string]: { [key: string]: string } }; label?: string }>(
    item: T | undefined,
    currentLang: string
  ): string => {
    if (!item) return '';
    if (item.translations?.[currentLang]?.label && typeof item.translations[currentLang].label === 'string') {
      return item.translations[currentLang].label;
    }
    return item.label || '';
  };

  // Build subtitle similar to InferenceJobGroup
  const subtitle = useMemo(() => {
    // Show loading indicator if any data is still loading
    const isLoading = scenesLoading || wardrobesLoading || colorsLoading;
    if (isLoading) {
      return '';
    }

    // Look up the data by value
    const sceneData = findSceneByValue(scene);
    const wardrobeData = findWardrobeByValue(wardrobe);
    const colorData = findColorByValue(color);

    // Get translated labels (lowercase for consistent formatting)
    const currentLang = i18n.language;
    const translatedScene = getTranslatedLabel(sceneData, currentLang).toLowerCase();
    const translatedWardrobe = getTranslatedLabel(wardrobeData, currentLang).toLowerCase();
    const translatedColor = getTranslatedLabel(colorData, currentLang).toLowerCase();
    
    // Return empty if we don't have the required data
    if (!style || !translatedScene || !translatedWardrobe || !translatedColor) {
      return '';
    }
    
    // Use the full translation with formatted style name and translated labels
    return t('shoot.subtitle', { ns: 'styles', style: styleFormatted, scene: translatedScene, wardrobe: translatedWardrobe, color: translatedColor });
  }, [
    styleFormatted,
    scene,
    wardrobe,
    color,
    scenesLoading,
    wardrobesLoading,
    colorsLoading,
    findSceneByValue,
    findWardrobeByValue,
    findColorByValue,
    i18n.language,
    t
  ]);

  const getAspectRatioClass = (ratio: AspectRatio): string => {
    switch (ratio) {
      case '1:1': return styles.aspectSquare;
      case '2:3': return styles.aspect23;
      case '3:2': return styles.aspect32;
      case '9:16': return styles.aspect916;
      default: return styles.aspectSquare;
    }
  };

  // Handle generate button click
  const handleGenerate = useCallback(() => {
    if (!styleId) {
      console.warn('No styleId provided, cannot update generation settings');
      return;
    }

    // Store style selections (scene, wardrobe, color)
    storeStyleSelections(styleId, {
      scene,
      wardrobe,
      color
    });

    // Store aspect ratio and quality in localStorage
    try {
      localStorage.setItem('generation-controls-aspect-ratio', JSON.stringify(aspectRatio));
      localStorage.setItem('generation-controls-quality', JSON.stringify(resolution));
      
      // Dispatch event to notify GenerateBar of changes
      window.dispatchEvent(new CustomEvent('style-selections-updated', { detail: { styleId } }));
    } catch (error) {
      console.error('Error storing generation settings:', error);
    }

    // Close the dialog
    onGenerate?.();
  }, [styleId, scene, wardrobe, color, aspectRatio, resolution, onGenerate]);

  return (
    <div className={`${styles.container} ${getAspectRatioClass(aspectRatio)}`}>
      <div className={styles.imageWrapper}>
        <img
          src={getAppCdnUrl(image)}
          alt={`${styleFormatted} preview`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.image}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleGenerate}
              className={styles.generateButton}
              aria-label={t('explore.generateTooltip', { ns: 'common', defaultValue: 'Generate this image' })}
            >
              <svg className={styles.generateIconDefault} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.875 9.125V3H9.125V9.125H3V10.875H9.125V17H10.875V10.875H17V9.125H10.875Z" fill="currentColor"/>
              </svg>
              <svg className={styles.generateIconHover} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.3887 0L9.49978 7.55556L16.6109 7.55556L8.61089 20L9.49978 12H2.38867L10.3887 0Z" fill="currentColor"/>
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {t('explore.generateTooltip', { ns: 'common', defaultValue: 'Generate this image' })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={styles.overlay}>
        <div className={styles.metadataContainer}>
          <div className={styles.metadataItem}>
            <svg className={styles.metadataIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 15.9531H4C3.73488 15.9528 3.4807 15.8474 3.29323 15.6599C3.10576 15.4724 3.0003 15.2182 3 14.9531L3 2.95312C3.00026 2.68799 3.10571 2.43379 3.29319 2.24631C3.48066 2.05883 3.73486 1.95339 4 1.95312L12 1.95312C12.2651 1.95343 12.5193 2.05888 12.7068 2.24635C12.8942 2.43382 12.9997 2.688 13 2.95312V14.9531C12.9996 15.2182 12.8942 15.4724 12.7067 15.6598C12.5193 15.8473 12.2651 15.9528 12 15.9531ZM4 2.95312L4 14.9531H12V2.95312L4 2.95312Z" fill="currentColor"/>
            </svg>
            <span className={styles.metadataText}>{aspectRatio}</span>
          </div>
          <div className={styles.metadataItem}>
            <svg className={styles.metadataIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8.00105 14.1896L13.8596 7.43062L11.2516 3.95312L4.75155 3.95313L2.14355 7.43062L8.00105 14.1896L7.99902 15.7031L7.24455 14.8446L0.859554 7.47563L4.25155 2.95313L11.7516 2.95312L15.1436 7.47563L8.75755 14.8441L7.99902 15.7031L8.00105 14.1896Z" fill="currentColor"/>
            </svg>
            <span className={styles.metadataText}>{resolution}</span>
          </div>
        </div>

        <p className={styles.subtitle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

