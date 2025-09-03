'use client';

import { FC, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './InferenceThumbnail.module.css';
import { getInferenceImageThumbnail, getInferenceImageCard } from '@/lib/utils/get-inference-image';

export interface InferenceThumbnail {
  id: string;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  imageUrl?: string;
  webImageUrl?: string;
  index: number;
  progress?: number;
  errorMessage?: string;
}

interface InferenceThumbnailProps {
  thumbnail: InferenceThumbnail;
  jobStatus?: 'queued' | 'pending' | 'running' | 'completed' | 'failed' | 'initializing' | 'generating';
  onClick?: () => void;
}

export const InferenceThumbnailComponent: FC<InferenceThumbnailProps> = ({
  thumbnail,
  jobStatus,
  onClick
}) => {
  // Track layered transition state between preview and final image
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(thumbnail.webImageUrl || thumbnail.imageUrl);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [finalLoaded, setFinalLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasMountedRef = useRef(false);
  
  // Check if we're using a base64 preview
  const isBase64Preview = (thumbnail.webImageUrl || thumbnail.imageUrl)?.startsWith('data:image/');

  // When incoming URL changes, preserve previous to enable crossfade
  useEffect(() => {
    const nextUrl = thumbnail.webImageUrl || thumbnail.imageUrl;
    if (!nextUrl) return;
    if (!currentUrl) {
      setCurrentUrl(nextUrl);
      return;
    }
    if (nextUrl !== currentUrl) {
      setPrevUrl(currentUrl);
      setCurrentUrl(nextUrl);
      setFinalLoaded(false);
    }
  }, [thumbnail.webImageUrl, thumbnail.imageUrl]);

  // Clear previous layer after crossfade completes
  useEffect(() => {
    if (!prevUrl || !finalLoaded) return;
    const t = setTimeout(() => setPrevUrl(null), 320);
    return () => clearTimeout(t);
  }, [prevUrl, finalLoaded]);
  
  const handleFinalImageLoad = useCallback(() => {
    // Small delay to allow overlay fade
    setTimeout(() => {
      setFinalLoaded(true);
      setImageError(false);
    }, 150);
  }, []);
  
  const handleImageError = useCallback((e: any) => {
    console.error(`❌ Image failed to load: ${thumbnail.webImageUrl || thumbnail.imageUrl}`, e);
    setImageError(true);
    setFinalLoaded(false);
  }, [thumbnail.webImageUrl, thumbnail.imageUrl]);
  
  const getStatusClass = () => {
    switch (thumbnail.status) {
      case 'queued': {
        // Distinguish queued because job is queued vs queued while job is running
        if (jobStatus === 'running' || jobStatus === 'pending' || jobStatus === 'initializing' || jobStatus === 'generating') {
          return `${styles.statusInitializing}`;
        }
        return `${styles.statusQueued}`;
      }
      case 'running':
        return styles.statusGenerating;
      case 'completed':
        return styles.statusCompleted;
      case 'failed':
        return styles.statusFailed;
      default:
        return '';
    }
  };

  // Determine if we should apply zoom on initial mount only (no preview swap)
  const shouldZoomOnMount = !hasMountedRef.current && !prevUrl;
  useEffect(() => { hasMountedRef.current = true; }, []);

  const hasAnyImage = Boolean(currentUrl || prevUrl);
  const showDualLayer = Boolean(prevUrl && currentUrl && currentUrl !== prevUrl && !finalLoaded);

  return (
    <div 
      className={`${styles.thumbnail} ${getStatusClass()}`}
      onClick={onClick}
      style={{ ['--stagger' as any]: thumbnail.index }}
    >
      {/* Image or placeholder */}
      <div className={styles.imageContainer}>
        {/* Gradient loader: hide if we have a visible preview layer; fade out once final is loaded */}
        {((thumbnail.status === 'running' && !prevUrl && !isBase64Preview) || (!finalLoaded && !prevUrl && !isBase64Preview)) && (
          <div className={`${styles.gradientLoader} ${finalLoaded || thumbnail.status === 'completed' ? styles.fadeOut : ''}`} />
        )}

        {hasAnyImage && !imageError ? (
          <>
            {/* Preview layer (only rendered while waiting for final to load) */}
            {prevUrl && showDualLayer && (
              <img
                src={prevUrl}
                alt={`Generating preview ${thumbnail.index + 1}`}
                className={`${styles.imageLayer} ${styles.visible}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                decoding="async"
              />
            )}

            {/* Final (or current) layer */}
            {(() => {
              const base = currentUrl!;
              const isBase64 = base?.startsWith('data:image/');
              if (isBase64) {
                return (
                  <Image
                    src={base}
                    alt={`Generated image ${thumbnail.index + 1}`}
                    fill
                    className={`${styles.imageLayer} ${finalLoaded || showDualLayer ? styles.visible : ''} ${shouldZoomOnMount ? styles.zoomOnMount : ''}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={thumbnail.status === 'completed'}
                    unoptimized={true}
                    onLoad={handleFinalImageLoad}
                    onError={handleImageError}
                  />
                );
              }
              const src480 = getInferenceImageThumbnail(base);
              const src720 = getInferenceImageCard(base);
              return (
                <img
                  src={src480}
                  srcSet={`${src480} 480w, ${src720} 720w`}
                  sizes="(max-width: 640px) 360px, 240px"
                  alt={`Generated image ${thumbnail.index + 1}`}
                  className={`${styles.imageLayer} ${finalLoaded || showDualLayer ? styles.visible : ''} ${shouldZoomOnMount ? styles.zoomOnMount : ''}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                  onLoad={handleFinalImageLoad}
                  onError={handleImageError}
                />
              );
            })()}

            {/* Show overlay while generating (kept over preview/final until final is ready) */}
            {thumbnail.status === 'running' && (prevUrl ? true : finalLoaded) && (
              <div className={styles.previewOverlay}></div>
            )}
          </>
        ) : (
          <div className={styles.placeholder}></div>
        )}
      </div>
    </div>
  );
};

