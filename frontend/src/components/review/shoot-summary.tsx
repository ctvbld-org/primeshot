'use client';

import React from 'react';
import styles from './shoot-summary.module.css';
import { Edit2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Image as ImageType, Style } from '@/lib/types';
import { useOrder } from '@/lib/hooks/use-order';
import { useOption, useOptions } from '@/hooks/useConfig';
import { useTranslatedOption } from '@/hooks/useTranslatedOption';

interface ShootSummaryProps {
  isLoading?: boolean;
  images?: string[];
}

const ShootSummary: React.FC<ShootSummaryProps> = ({ isLoading: externalLoading = false, images = [] }) => {
  // Use the order hook to get the latest paid order and its styles
  const { order, styles: orderStyles, isLoading: orderLoading } = useOrder({ loadStyles: true });
  
  // Get style options and their translations
  const { data: rawBackgroundOptions } = useOption('background');
  const { data: rawClothingOptions } = useOption('clothing');
  const { data: rawClothingColorOptions } = useOption('clothingColor');
  
  const backgroundOptions = useTranslatedOption(rawBackgroundOptions);
  const clothingOptions = useTranslatedOption(rawClothingOptions);
  const clothingColorOptions = useTranslatedOption(rawClothingColorOptions);
  
  // Combine external and internal loading states
  const isLoading = externalLoading || orderLoading;
  
  // Calculate total photos from styles
  const totalPhotos = orderStyles?.reduce((total, style) => total + 20, 0) || 0;
  
  // Helper function to get translated label for a style option
  const getTranslatedLabel = (optionType: 'background' | 'clothing' | 'clothingColor', optionId: string | undefined): string => {
    if (!optionId) return '';
    
    const options = {
      background: backgroundOptions,
      clothing: clothingOptions,
      clothingColor: clothingColorOptions
    }[optionType];
    
    return options?.options.find(opt => opt.id === optionId)?.label || optionId;
  };
    
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Shoot Summary</h2>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <span className={styles.label}>Photos</span>
            <button className={styles.editButton}>
              <span>Edit</span>
            </button>
          </div>
          
          <div className={styles.averageScore}>
            <span className={styles.label}>AVG.</span>
            <div className={styles.scoreTag}>
              <CheckCircle size={14} className={styles.checkIcon} />
              <span>81%</span>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingState}>Loading photos...</div>
        ) : (
          <div className={styles.photosGrid}>
            {images.map((photo, index) => (
              <div key={index} className={styles.photoItem}>
                <img src={photo} alt={`Photo ${index + 1}`} className={styles.photo} />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.section}>
        <div className={styles.stylesTitle}>
          <span>Styles</span>
          <p className={styles.styleSubtitle}>
            You've purchased {totalPhotos} headshots across {orderStyles?.length || 0} styles.
          </p>
        </div>
        
        <div className={styles.stylesList}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading styles...</div>
          ) : orderStyles?.map((style, index) => (
            <div key={style.id} className={styles.styleItem}>
              <div className={styles.styleNumber}>{index + 1}</div>
              <div className={styles.styleInfo}>
                <h3 className={styles.styleName}>{style.name}</h3>
                <p className={styles.styleDetails}>
                  {getTranslatedLabel('background', style.settings?.background)} · {getTranslatedLabel('clothing', style.settings?.clothing)} · {getTranslatedLabel('clothingColor', style.settings?.clothingColor)}
                </p>
              </div>
              <div className={styles.styleCount}>
                <ImageIcon size={14} />
                <span>20</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShootSummary;