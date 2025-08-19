'use client';

import { FC } from 'react';
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
  const getStatusText = () => {
    switch (thumbnail.status) {
      case 'queued':
        return 'Queued...';
      case 'running':
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
        {thumbnail.webImageUrl || thumbnail.imageUrl ? (
          <>
            <Image
              src={thumbnail.webImageUrl || thumbnail.imageUrl!}
              alt={`Generated image ${thumbnail.index + 1}`}
              fill
              className={`${styles.image} ${thumbnail.status === 'running' ? styles.imageGenerating : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={thumbnail.status === 'completed'}
            />
            {/* Show overlay for preview images that are still generating */}
            {thumbnail.status === 'running' && (
              <div className={styles.previewOverlay}>
                <div className={styles.loadingSpinner} />
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

