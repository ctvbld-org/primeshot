'use client';

import React from 'react';
import styles from './shoot-summary.module.css';
import { useOrder } from '@/lib/hooks/use-order';
import { useOrderImages } from '@/lib/hooks/use-order-images';
import { useOption } from '@/hooks/useConfig';
import { useTranslatedOption } from '@/hooks/useTranslatedOption';
import Link from 'next/link';
import { Icon } from '@/components/icons/icon';
import { calculatePricing } from '@/lib/pricing';

interface ShootSummaryProps {
  isLoading?: boolean;
  images?: string[];
}

const ShootSummary: React.FC<ShootSummaryProps> = ({ isLoading: externalLoading = false, images = [] }) => {
  // Use the order hook to get the latest paid order and its styles
  const { order, styles: orderStyles, isLoading: orderLoading } = useOrder({ loadStyles: true });
  
  // Get images with quality scores
  const { images: orderImages, isLoading: imagesLoading } = useOrderImages(order?.id);
  
  // Get style options and their translations
  const { data: rawBackgroundOptions } = useOption('background');
  const { data: rawClothingOptions } = useOption('clothing');
  const { data: rawClothingColorOptions } = useOption('clothingColor');
  
  const backgroundOptions = useTranslatedOption(rawBackgroundOptions);
  const clothingOptions = useTranslatedOption(rawClothingOptions);
  const clothingColorOptions = useTranslatedOption(rawClothingColorOptions);
  
  // Combine external and internal loading states
  const isLoading = externalLoading || orderLoading || imagesLoading;
  // Calculate pricing info and total photos based on number of styles
  const pricingInfo = orderStyles && orderStyles.length > 0 ? calculatePricing(orderStyles.length) : null;
  const totalPhotos = pricingInfo?.totalHeadshots || 0;
  const headshotsPerStyle = pricingInfo?.headshotsPerStyle || 0;

  // Calculate average quality score
  const averageScore = React.useMemo(() => {
    if (!orderImages?.length) return 0;
    const totalScore = orderImages.reduce((sum, img) => sum + (img.score || 0), 0);
    return Math.round((totalScore / orderImages.length));
  }, [orderImages]);
  
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
            <Link href="/app/upload" className={styles.editButton}>
              <span>Edit</span>
            </Link>
          </div>
          
          <div className={styles.averageScore}>
            <span className={styles.label}>AVG.</span>
            <div className={styles.scoreTag}>
              <Icon variant="check" size={16} className={styles.scoreIcon} />
              <span>{averageScore}%</span>
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
                <h3 className={styles.styleName}>
                  <span className={styles.name}>{style.name}</span>
                  <div className={styles.styleCount}>
                    <Icon variant="camera" size={14} />
                    <span>{headshotsPerStyle || 0}</span>
                  </div>
                </h3>
                <p className={styles.styleDetails}>
                  {getTranslatedLabel('background', style.settings?.background)} · {getTranslatedLabel('clothing', style.settings?.clothing)} · {getTranslatedLabel('clothingColor', style.settings?.clothingColor)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShootSummary;