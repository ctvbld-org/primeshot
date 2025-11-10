'use client';

import React, { useMemo, useCallback, Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ExploreThumb from '@/components/ExploreThumb';
import { Button } from "@primeshot/common/web/ui/button";
import ContentPageHeader from '@/components/ContentPageHeader';
import type { ExploreImage } from '@primeshot/common/types/explore';
import { getWebsiteCdnUrl } from '@primeshot/common/lib/utils/cdn';
import { getApiUrl } from '@primeshot/common/lib/api/client';
import { parseExploreImageFilename, type AspectRatio } from '@/lib/utils/parse-explore-image-metadata';
import styles from './page.module.css';

// Extended type for parsed explore images with metadata from filename
interface ParsedExploreImage {
  id: string;
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
}

// Dynamic filter generation from data
const getDynamicFilters = (data: ParsedExploreImage[]): string[] => {
  const categories = new Set(data.map(item => item.category).filter(Boolean));
  return ["All", ...Array.from(categories).sort()];
};

function ExploreContent() {
  const { t } = useTranslation('explore');
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('style') || 'All';
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Fetch explore data from API
  const [exploreData, setExploreData] = useState<ParsedExploreImage[]>([]);
  const [styleFilters, setStyleFilters] = useState<string[]>(['All']);
  const [styleFilterData, setStyleFilterData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch explore data (fetch all categories once)
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('/api/explore'));
        if (response.ok) {
          const data = await response.json();
          
          // Parse metadata from filenames
          const parsedImages: ParsedExploreImage[] = (data.images || []).map((img: any) => {
            // Remove "placeholders/styles/" prefix from filename before parsing
            const filename = img.image.replace(/^placeholders\/styles\//i, '');
            const metadata = parseExploreImageFilename(filename);
            
            if (!metadata) {
              console.warn('Failed to parse filename:', img.image);
              return null;
            }
            
            return {
              id: img.id,
              image: img.image,
              aspectRatio: metadata.aspectRatio,
              resolution: metadata.resolution,
              model: 'Primeshot v1',
              style: metadata.styleFormatted,
              scene: metadata.scene,
              wardrobe: metadata.wardrobe,
              color: metadata.color,
              category: img.category,
              shortCode: img.shortCode, // NEW: include short code
            };
          }).filter((img: ParsedExploreImage | null): img is ParsedExploreImage => img !== null); // Remove nulls with type guard
          
          setExploreData(parsedImages);
          setStyleFilterData(data.categories || {});
          
          // Extract unique categories for filters
          const uniqueCategories = Array.from(new Set(parsedImages.map((img: ParsedExploreImage) => img.category).filter(Boolean)));
          setStyleFilters(['All', ...uniqueCategories.sort()]);
        }
      } catch (error) {
        console.error('Failed to fetch explore data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []); // Only fetch once on mount

  useEffect(() => {
    if (!mounted) return;
    
    if (activeFilter !== "All") {
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [activeFilter, mounted]);

  const filteredData = useMemo(() => {
    if (activeFilter === "All") return exploreData;
    return exploreData.filter(item => item.category === activeFilter);
  }, [activeFilter, exploreData]);

  const handleFilterChange = useCallback((filter: string) => {
    if (filter === activeFilter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'All') {
      params.delete('style');
    } else {
      params.set('style', filter);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/explore${newUrl}`, { scroll: false });
  }, [activeFilter, router, searchParams]);

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <ContentPageHeader 
          title={t('title')}
          backgroundImage={getWebsiteCdnUrl('/golden-noir-01.webp')} 
        />
        <div className={styles.contentWrapper}>
          <div className={styles.loading}>Loading explore images...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <ContentPageHeader 
        title={t('title')}
        backgroundImage={getWebsiteCdnUrl('/golden-noir-01.webp')} 
      />
      <div className={styles.contentWrapper}>  
        
        <div className={styles.filtersSection}>
          {/* Style Filters */}
          <div className={styles.filtersContainer}>
            {styleFilters.map(filter => (
                <Button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  variant="ghost"
                  className={`${styles.filterButton} ${
                    activeFilter === filter
                      ? styles.filterButtonActive
                      : styles.filterButtonInactive
                  }`}
                >
                  {filter}
                </Button>
            ))}
          </div>
           {/* Style Filters Content */}
          {activeFilter !== "All" && mounted && styleFilterData[activeFilter] && (
            <div className={styles.styleDetailsSection}>
              <div key={activeFilter} className={`${styles.styleDetailsContent} ${isVisible ? styles.styleDetailsContentVisible : styles.styleDetailsContentHidden}`}>
                 <div className={styles.styleInfo}>
                   <h2 className={styles.styleTitle}>
                     {styleFilterData[activeFilter].name}
                   </h2>
                   <p className={styles.styleDescription}>
                     {styleFilterData[activeFilter].description}
                   </p>
                 </div>
                 <div className={styles.styleActions}>
                   <div className={styles.styleIcons}>
                    <div className={styles.iconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.icon}>
                        <path d="M2 10L10 2M2 10V14M2 10V6M10 2H14M10 2H6M10 18L18 10M10 18H6M10 18H14M18 10V6M18 10V14M2 14C2 14 2 15.0553 2 16.2222C2 17.204 2.79597 18 3.77781 18C4.94468 18 6 18 6 18M2 14L14 2M14 2H16.2222C17.2041 2 18 2.79594 18 3.77778V6M6 18L18 6M14 18H16.2222C17.2041 18 18 17.2041 18 16.2222V14M14 18L18 14M2 6V3.77778C2 2.79594 2.79594 2 3.77778 2H6M2 6L6 2" stroke="currentColor" strokeLinejoin="round"/>
                        <path d="M2.88867 17.1109L17.1109 2.88867" stroke="currentColor"/>
                      </svg>
                    </div>
                    <div className={styles.iconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.icon}>
                        <path d="M16.9835 2.88366L13.3335 1.66699C13.3335 2.55105 12.9823 3.39889 12.3572 4.02402C11.7321 4.64914 10.8842 5.00033 10.0002 5.00033C9.1161 5.00033 8.26825 4.64914 7.64313 4.02402C7.01801 3.39889 6.66682 2.55105 6.66682 1.66699L3.01682 2.88366C2.63964 3.00932 2.3198 3.26567 2.11503 3.60644C1.91027 3.94722 1.83405 4.34996 1.90016 4.74199L2.38349 7.63366C2.41522 7.82942 2.51572 8.00745 2.66694 8.13575C2.81816 8.26406 3.01017 8.33423 3.20849 8.33366H5.00016V16.667C5.00016 17.5837 5.75016 18.3337 6.66682 18.3337H13.3335C13.7755 18.3337 14.1994 18.1581 14.512 17.8455C14.8246 17.5329 15.0002 17.109 15.0002 16.667V8.33366H16.7918C16.9901 8.33423 17.1822 8.26406 17.3334 8.13575C17.4846 8.00745 17.5851 7.82942 17.6168 7.63366L18.1002 4.74199C18.1663 4.34996 18.09 3.94722 17.8853 3.60644C17.6805 3.26567 17.3607 3.00932 16.9835 2.88366Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                   </div>
                   <Button 
                     className={styles.customiseButton}
                     onClick={() => window.location.href = styleFilterData[activeFilter].ctaLink}
                   >
                     {t('buttons.customiseStyle')}
                   </Button>
                 </div>
               </div>
            </div>
          )}
        </div>
          
        {/* Explore Grid */}
        <div className={styles.gridContainer}>
          <div className={styles.masonryGrid}>
          {filteredData.map((item, index) => (
            <div
              key={`${item.id}-${activeFilter}`}
              className={styles.gridItem}
            >
              <ExploreThumb
                image={item.image}
                aspectRatio={item.aspectRatio}
                resolution={item.resolution}
                model={item.model}
                style={item.style}
                scene={item.scene}
                wardrobe={item.wardrobe}
                color={item.color}
                category={item.category}
                shortCode={item.shortCode}
                staggerIndex={index}
                  totalItems={filteredData.length}
              />
            </div>
          ))}
          </div>
        </div>

        {filteredData.length === 0 && !isLoading && (
          <div className={styles.noResults}>
              {t('noResults', { filter: activeFilter })}
            <button onClick={() => handleFilterChange("All")} className={styles.showAllButton}>
              {t('buttons.showAllStyles')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useTranslation('explore');
  
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>{t('loading')}</div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}