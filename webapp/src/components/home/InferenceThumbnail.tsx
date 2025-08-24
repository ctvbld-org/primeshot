'use client';

import { FC, useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './InferenceThumbnail.module.css';

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
  onClick?: () => void;
}

export const InferenceThumbnailComponent: FC<InferenceThumbnailProps> = ({
  thumbnail,
  onClick
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Check if we're using a base64 preview
  const isBase64Preview = (thumbnail.webImageUrl || thumbnail.imageUrl)?.startsWith('data:image/');
  
  const handleImageLoad = useCallback(() => {
    // Small delay to ensure gradient is visible even for fast-loading images
    setTimeout(() => {
      setImageLoaded(true);
      setImageError(false);
    }, 300);
  }, []);
  
  const handleImageError = useCallback((e: any) => {
    console.error(`❌ Image failed to load: ${thumbnail.webImageUrl || thumbnail.imageUrl}`, e);
    setImageError(true);
    setImageLoaded(false);
  }, [thumbnail.webImageUrl, thumbnail.imageUrl]);
  
  const getStatusText = () => {
    switch (thumbnail.status) {
      case 'queued':
        return 'Queued...';
      case 'running':
        if (isBase64Preview) {
          return thumbnail.progress ? `${Math.round(thumbnail.progress)}%` : 'Live Preview';
        }
        return thumbnail.progress ? `${Math.round(thumbnail.progress)}%` : 'Generating...';
      case 'completed':
        return '';
      case 'failed':
        return thumbnail.errorMessage || 'Failed';
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    switch (thumbnail.status) {
      case 'queued':
        return styles.statusQueued;
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

  return (
    <div 
      className={`${styles.thumbnail} ${getStatusClass()}`}
      onClick={onClick}
    >
      {/* Image or placeholder */}
      <div className={styles.imageContainer}>
        {/* Show gradient loader overlay when loading or generating, but hide when we have a preview image */}
        {((thumbnail.status === 'running' && !isBase64Preview) || (!imageLoaded && !isBase64Preview)) && (
          <div className={`${styles.gradientLoader} ${imageLoaded && thumbnail.status === 'completed' ? styles.fadeOut : ''}`}>
            {thumbnail.status === 'running' && (
              <div className={styles.generatingText}>Generating...</div>
            )}
            {thumbnail.status === 'queued' && (
              <div className={styles.queuedText}>Queued</div>
            )}
          </div>
        )}
        
        {(thumbnail.webImageUrl || thumbnail.imageUrl) && !imageError ? (
          <>
            {isBase64Preview ? (
              <Image
                src={thumbnail.webImageUrl || thumbnail.imageUrl!}
                alt={`Generated image ${thumbnail.index + 1}`}
                fill
                className={`${styles.image} ${imageLoaded ? styles.fadeIn : ''} ${thumbnail.status === 'running' ? styles.imageGenerating : ''} ${styles.base64Preview}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={thumbnail.status === 'completed'}
                unoptimized={true} // Disable Next.js optimization for base64 images
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <img
                src={thumbnail.webImageUrl || thumbnail.imageUrl!}
                alt={`Generated image ${thumbnail.index + 1}`}
                className={`${styles.image} ${imageLoaded ? styles.fadeIn : ''} ${thumbnail.status === 'running' ? styles.imageGenerating : ''}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
            {/* Show overlay for preview images that are still generating */}
            {thumbnail.status === 'running' && imageLoaded && (
              <div className={styles.previewOverlay}>
                <div className={styles.loadingSpinner} />
                {isBase64Preview && (
                  <div className={styles.previewBadge}>LIVE</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.placeholder}>
            {thumbnail.status === 'running' && (
              <>
                <div className={styles.loadingSpinner} />
                <div className={styles.generatingText}>Generating...</div>
              </>
            )}
            {thumbnail.status === 'queued' && (
              <div className={styles.queuedText}>Queued</div>
            )}
            {thumbnail.status === 'failed' && (
              <div className={styles.failedText}>Failed to generate</div>
            )}
            {imageError && thumbnail.status === 'completed' && (
              <div className={styles.errorText}>Image failed to load</div>
            )}
          </div>
        )}
      </div>

      {/* Status overlay */}
      {getStatusText() && (
        <div className={styles.statusOverlay}>
          <span className={styles.statusText}>
            {getStatusText()}
          </span>
        </div>
      )}

      {/* Progress bar for generating state */}
      {thumbnail.status === 'running' && thumbnail.progress && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${thumbnail.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

