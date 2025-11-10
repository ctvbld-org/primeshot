import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { getAppCdnUrl } from '@primeshot/common/lib/utils/cdn';
import { useStyleData } from '@primeshot/common';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import styles from './ExploreThumb.module.css';

export type AspectRatio = '1:1' | '2:3' | '3:2' | '9:16';

interface ExploreThumbProps {
  image: string;
  aspectRatio: AspectRatio;
  resolution: string;
  model: string;
  style: string;
  scene: string;
  wardrobe: string;
  color: string;
  category: string;
  shortCode?: string; // NEW: short code for URL shortener
  staggerIndex?: number;
  totalItems?: number;
  priority?: boolean;
  fillWidth?: boolean;
  forceVisible?: boolean;
  slideFromRight?: boolean; // NEW: slide in from right animation
}

function useLazyLoad(threshold = 0.1, forceVisible?: boolean) {
  const [isInView, setIsInView] = useState(forceVisible || false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceVisible) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    observer.observe(element);

    if (element.getBoundingClientRect().top < window.innerHeight) {
      setIsInView(true);
      observer.unobserve(element);
    }

    return () => observer.disconnect();
  }, [threshold, forceVisible]);

  return { ref, isInView };
}

const ExploreThumb: React.FC<ExploreThumbProps> = ({
  image,
  aspectRatio,
  resolution,
  model,
  style,
  scene,
  wardrobe,
  color,
  category,
  shortCode,
  staggerIndex = 0,
  totalItems = 1,
  priority = false,
  forceVisible = false,
  slideFromRight = false
}) => {
  const { ref, isInView } = useLazyLoad(0.1, forceVisible);
  const { t, i18n } = useTranslation(['styles', 'common']);
  const { findSceneByValue, findWardrobeByValue, findColorByValue, scenesLoading, wardrobesLoading, colorsLoading } = useStyleData();
  
  // Generate URL - use short code if available, otherwise fallback to query params
  const generateUrl = useMemo(() => {
    if (shortCode) {
      return `/s/${shortCode}`;
    }
    // Fallback for backward compatibility (explore images without short codes)
    return `/create?style=${encodeURIComponent(style.toLowerCase().replace(/\s+/g, ''))}&scene=${encodeURIComponent(scene)}&wardrobe=${encodeURIComponent(wardrobe)}&color=${encodeURIComponent(color)}&aspectRatio=${encodeURIComponent(aspectRatio)}&quality=${encodeURIComponent(resolution)}`;
  }, [shortCode, style, scene, wardrobe, color, aspectRatio, resolution]);
  
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
    
    // Use the full translation with style (untranslated) and translated labels
    return t('shoot.subtitle', { ns: 'styles', style, scene: translatedScene, wardrobe: translatedWardrobe, color: translatedColor });
  }, [
    style,
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

  const maxDelay = 0.5;
  const staggerDelay = (staggerIndex / totalItems) * maxDelay;

  return (
    <motion.div
      ref={ref}
      initial={slideFromRight ? { opacity: 0, x: 50 } : { opacity: 0, scale: 0.9 }}
      animate={isInView ? (slideFromRight ? { opacity: 1, x: 0 } : { opacity: 1, scale: 1 }) : {}}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay: staggerDelay
      }}
      className={`${styles.container} ${getAspectRatioClass(aspectRatio)}`}
    >
      <div className={styles.imageWrapper}>
        {isInView ? (
          <img
            src={getAppCdnUrl(image)}
            alt={category}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href={generateUrl}
              className={styles.generateButton}
            >
              <svg className={styles.generateIconDefault} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.875 9.125V3H9.125V9.125H3V10.875H9.125V17H10.875V10.875H17V9.125H10.875Z" fill="currentColor"/>
              </svg>
              <svg className={styles.generateIconHover} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10.3887 0L9.49978 7.55556L16.6109 7.55556L8.61089 20L9.49978 12H2.38867L10.3887 0Z" fill="currentColor"/>
              </svg>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            {t('explore.generateTooltip', { ns: 'common', defaultValue: 'Generate this image' })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={styles.overlay}>
        <div className={styles.metadataContainer}>
          <div className={styles.metadataItem}>
            <svg className={styles.metadataIcon} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 15.9531H4C3.73488 15.9528 3.4807 15.8474 3.29323 15.6599C3.10576 15.4724 3.0003 15.2182 3 14.9531L3 2.95312C3.00026 2.68799 3.10571 2.43379 3.29319 2.24631C3.48066 2.05883 3.73486 1.95339 4 1.95312L12 1.95312C12.2651 1.95343 12.5193 2.05888 12.7068 2.24635C12.8942 2.43382 12.9997 2.688 13 2.95312V14.9531C12.9996 15.2182 12.8942 15.4724 12.7067 15.6598C12.5193 15.8473 12.2651 15.9528 12 15.9531ZM4 2.95312L4 14.9531H12V2.95312L4 2.95312Z" fill="currentColor"/></svg>
            <span className={styles.metadataText}>{aspectRatio}</span>
          </div>
          <div className={styles.metadataItem}>
            <svg className={styles.metadataIcon} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.00105 14.1896L13.8596 7.43062L11.2516 3.95312L4.75155 3.95313L2.14355 7.43062L8.00105 14.1896L7.99902 15.7031L7.24455 14.8446L0.859554 7.47563L4.25155 2.95313L11.7516 2.95312L15.1436 7.47563L8.75755 14.8441L7.99902 15.7031L8.00105 14.1896Z" fill="currentColor"/></svg>
            <span className={styles.metadataText}>{resolution}</span>
          </div>
          <div className={styles.metadataItem}>
            <svg className={styles.metadataIcon} width="16" height="16" viewBox="0 0 16 16" fill="none"><g clipPath="url(#clip0_3105_3023)"><path d="M4.06934 9.17383C4.06934 9.78639 4.19468 10.394 4.43652 10.96C4.67842 11.5258 5.03264 12.0405 5.47949 12.4736C5.92648 12.9068 6.45799 13.2499 7.04199 13.4844C7.62597 13.7188 8.25171 13.8398 8.88379 13.8398V15.8457C7.97981 15.8457 7.08419 15.6731 6.24902 15.3379C5.41412 15.0027 4.65566 14.5109 4.0166 13.8916C3.37756 13.2722 2.87032 12.5367 2.52441 11.7275C2.17856 10.9182 2 10.0498 2 9.17383H4.06934ZM13 8.38281C13 9.90915 11.7233 11.1463 10.1484 11.1465H8.89258V10.1309H10.9463V4.49805H13V8.38281ZM7.57129 1.95312C8.29608 1.95332 8.88358 2.52318 8.88379 3.22559C8.88355 3.92797 8.29606 4.49687 7.57129 4.49707C6.84634 4.49707 6.25805 3.92809 6.25781 3.22559C6.25803 2.52306 6.84633 1.95313 7.57129 1.95312Z" fill="currentColor"/></g><defs><clipPath id="clip0_3105_3023"><rect width="11" height="14" fill="currentColor" transform="translate(2 1.95312)"/></clipPath></defs></svg>
            <span className={styles.metadataText}>{model}</span>
          </div>
        </div>

        <p className={styles.subtitle}>
          {subtitle}
        </p>

        <span className={styles.category}>
          {category}
        </span>
      </div>
    </motion.div>
  );
};

export default ExploreThumb;