'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { Icon } from '@primeshot/common/web/Icon';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { getInferenceImageOriginal, getInferenceImageThumbnail, getInferenceImageCard } from '@/lib/utils/get-inference-image';
import styles from './InferenceImageViewerDialog.module.css';

// Simple module-level preloaded image cache to avoid duplicate network requests
const preloadedImages = new Set<string>();
function preloadImage(url: string | undefined | null) {
  if (!url) return;
  if (preloadedImages.has(url)) return;
  const img = new Image();
  img.src = url;
  preloadedImages.add(url);
}

interface InferenceImageViewerDialogProps {
  job: InferenceJob;
  initialImageIndex: number;
  fullscreen?: boolean;
  noContainer?: boolean;
}

export const InferenceImageViewerDialog: FC<InferenceImageViewerDialogProps> = ({
  job,
  initialImageIndex,
}) => {
  const { closeDialog } = useDialogService();
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [imageLoading, setImageLoading] = useState(true);

  const currentThumbnail = job.thumbnails[currentImageIndex];
  const completedThumbnails = job.thumbnails.filter(thumb => thumb.status === 'completed');

  // Calculate shoot number (this would need to be passed from parent or calculated)
  const shootNumber = 3; // Placeholder - should be calculated from job data

  // Reset loading state when image index changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentImageIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentImageIndex(prev => 
          prev > 0 ? prev - 1 : job.thumbnails.length - 1
        );
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentImageIndex(prev => 
          prev < job.thumbnails.length - 1 ? prev + 1 : 0
        );
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDialog, job.thumbnails.length]);

  // Prefetch neighbor images (±2) for snappier navigation
  useEffect(() => {
    const neighborOffsets = [-2, -1, 1, 2];
    const total = job.thumbnails.length;
    for (const offset of neighborOffsets) {
      const idx = (currentImageIndex + offset + total) % total;
      const neighbor = job.thumbnails[idx];
      if (!neighbor || neighbor.status !== 'completed') continue;
      const base = neighbor.webImageUrl || neighbor.imageUrl || '';
      if (!base) continue;
      preloadImage(base);
      // Also warm 480/720 used by thumbnails
      preloadImage(getInferenceImageThumbnail(base));
      preloadImage(getInferenceImageCard(base));
    }

    // Idle prefetch the original for the current image (useful for immediate download)
    const base = currentThumbnail?.webImageUrl || currentThumbnail?.imageUrl || '';
    const original = base ? getInferenceImageOriginal(base) : '';
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
    if (original) {
      if (typeof ric === 'function') {
        ric(() => preloadImage(original));
      } else {
        // Fallback to setTimeout if requestIdleCallback isn't available
        setTimeout(() => preloadImage(original), 0);
      }
    }
  }, [currentImageIndex, job.thumbnails, currentThumbnail]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    console.error('Failed to load image:', currentThumbnail?.imageUrl || currentThumbnail?.webImageUrl);
  }, [currentThumbnail]);

  // Action handlers
  const handleDownload = useCallback(() => {
    if (!currentThumbnail?.imageUrl && !currentThumbnail?.webImageUrl) return;
    
    // Use imageUrl (original) for download, fallback to webImageUrl
    const imageUrl = currentThumbnail.imageUrl || currentThumbnail.webImageUrl!;
    
    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `shoot-${shootNumber.toString().padStart(3, '0')}-img-${currentImageIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentThumbnail, shootNumber, currentImageIndex]);

  const handleDelete = useCallback(() => {
    // TODO: Implement delete functionality
    console.log('Delete image:', currentThumbnail?.id);
  }, [currentThumbnail]);

  const handleRegenerate = useCallback(() => {
    // TODO: Implement regenerate functionality
    console.log('Regenerate image:', currentThumbnail?.id);
  }, [currentThumbnail]);

  const handleThumbnailClick = useCallback((index: number) => {
    // Only change state if clicking a different thumbnail
    if (index !== currentImageIndex) {
      setCurrentImageIndex(index);
    }
  }, [currentImageIndex]);

  if (!currentThumbnail) {
    return null;
  }

  // Prefer web variant for faster display; fallback to original
  const mainImageUrl = currentThumbnail.webImageUrl || currentThumbnail.imageUrl || '';
  
  return (
    <div className={styles.viewer}>
      {/* Close button */}
      <button 
        className={styles.closeButton}
        onClick={closeDialog}
        aria-label="Close viewer"
      >
        <Icon variant="cross" size={24} />
      </button>

      {/* Main image area */
      }
      <div className={styles.imageArea}>
        {imageLoading && (
          <div className={styles.imageLoading}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        {mainImageUrl && (
          <img
            src={mainImageUrl}
            alt={`Generated image ${currentImageIndex + 1}`}
            className={styles.mainImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
            decoding="async"
            style={{ opacity: imageLoading ? 0 : 1 }}
          />
        )}
        {/* Floating download original button */}
        <button
          className={styles.downloadOriginalButton}
          onClick={() => {
            const base = currentThumbnail.webImageUrl || currentThumbnail.imageUrl || '';
            if (!base) return;
            const original = getInferenceImageOriginal(base);
            const link = document.createElement('a');
            link.href = original;
            link.download = `shoot-${shootNumber.toString().padStart(3, '0')}-img-${currentImageIndex + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          aria-label="Download original image"
          disabled={!currentThumbnail.webImageUrl && !currentThumbnail.imageUrl}
        >
          <Icon variant="download" size={20} />
        </button>
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        {/* Image metadata */}
        <div className={styles.metadata}>
          <h3 className={styles.title}>
            Shoot {shootNumber} IMG {currentImageIndex + 1}
          </h3>
          
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Aspect Ratio</span>
              <span className={styles.metadataValue}>4:5 (Portrait)</span>
            </div>
            
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Quality</span>
              <span className={styles.metadataValue}>4K</span>
            </div>
            
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Model</span>
              <span className={styles.metadataValue}>Primeshot v1</span>
            </div>
            
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Character</span>
              <span className={styles.metadataValue}>Sarah</span>
            </div>
          </div>

          <div className={styles.timeAgo}>14 ago</div>
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={handleDownload}
            aria-label="Download image"
            disabled={!currentThumbnail.imageUrl && !currentThumbnail.webImageUrl}
          >
            <Icon variant="download" size={20} />
          </button>
          
          <button
            className={styles.actionButton}
            onClick={handleDelete}
            aria-label="Delete image"
          >
            <Icon variant="bin" size={20} />
          </button>
          
          <button
            className={styles.actionButton}
            onClick={handleRegenerate}
            aria-label="Regenerate image"
          >
            <Icon variant="generate" size={20} />
          </button>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className={styles.thumbnailStrip}>
        {job.thumbnails.map((thumbnail, index) => (
          <div
            key={thumbnail.id}
            className={`${styles.thumbnailItem} ${
              index === currentImageIndex ? styles.thumbnailActive : ''
            } ${thumbnail.status !== 'completed' ? styles.thumbnailDisabled : ''}`}
            onClick={() => thumbnail.status === 'completed' && handleThumbnailClick(index)}
          >
            {thumbnail.webImageUrl || thumbnail.imageUrl ? (
              (() => {
                const base = thumbnail.webImageUrl || thumbnail.imageUrl!;
                const src480 = getInferenceImageThumbnail(base);
                const src720 = getInferenceImageCard(base);
                return (
                  <img
                    src={src480}
                    srcSet={`${src480} 480w, ${src720} 720w`}
                    sizes="(max-width: 640px) 360px, 240px"
                    alt={`Thumbnail ${index + 1}`}
                    className={styles.thumbnailImage}
                    loading="lazy"
                    decoding="async"
                  />
                );
              })()
            ) : (
              <div className={styles.thumbnailPlaceholder}>
                {thumbnail.status === 'running' && (
                  <div className={styles.thumbnailSpinner} />
                )}
              </div>
            )}
            
            {thumbnail.status === 'running' && thumbnail.progress && (
              <div className={styles.thumbnailProgress}>
                <div 
                  className={styles.thumbnailProgressBar}
                  style={{ width: `${thumbnail.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
