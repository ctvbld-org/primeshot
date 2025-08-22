'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { Icon } from '@primeshot/common/web/Icon';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import styles from './InferenceImageViewerDialog.module.css';

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

  // Use imageUrl (original) for main display, fallback to webImageUrl
  const mainImageUrl = currentThumbnail.imageUrl || currentThumbnail.webImageUrl || '';
  
  // Debug logging
  console.log('🖼️ Image URLs for dialog:', {
    imageUrl: currentThumbnail.imageUrl,
    webImageUrl: currentThumbnail.webImageUrl,
    mainImageUrl,
    thumbnailStatus: currentThumbnail.status
  });

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

      {/* Main image area */}
      <div className={styles.imageArea}>
        {imageLoading && (
          <div className={styles.imageLoading}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        {mainImageUrl && (
          <img
            key={`${currentImageIndex}-${mainImageUrl}`}
            src={mainImageUrl}
            alt={`Generated image ${currentImageIndex + 1}`}
            className={styles.mainImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: imageLoading ? 0 : 1 }}
          />
        )}
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
              <img
                src={thumbnail.webImageUrl || thumbnail.imageUrl!}
                alt={`Thumbnail ${index + 1}`}
                className={styles.thumbnailImage}
              />
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
