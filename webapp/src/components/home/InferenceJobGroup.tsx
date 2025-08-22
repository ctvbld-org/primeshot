'use client';

import { FC } from 'react';
import { InferenceThumbnailComponent } from './InferenceThumbnail';
import { InferenceImageViewerDialog } from './InferenceImageViewerDialog';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { useLazyImage } from '@/hooks/useLazyLoading';
import styles from './InferenceJobGroup.module.css';

interface InferenceJobGroupProps {
  job: InferenceJob;
  shootNumber: number;
}

export const InferenceJobGroup: FC<InferenceJobGroupProps> = ({ job, shootNumber }) => {
  const { openDialog } = useDialogService();
  const { ref: lazyRef, isVisible } = useLazyImage({
    rootMargin: '300px', // Load images 300px before they come into view
    threshold: 0.1
  });

  // Handle thumbnail click to open fullscreen viewer
  const handleThumbnailClick = (thumbnailIndex: number) => {
    // Only open dialog for completed images
    if (job.thumbnails[thumbnailIndex]?.status === 'completed') {
      openDialog(
        <InferenceImageViewerDialog
          job={job}
          initialImageIndex={thumbnailIndex}
          fullscreen={true}
          noContainer={true}
        />
      );
    }
  };

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (job.status) {
      case 'queued':
        return 'Queued...';
      case 'running':
        return 'Generating...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return job.status;
    }
  };

  // Get progress if available
  const getProgress = () => {
    if (job.status === 'completed') return 100;
    if (job.status === 'failed') return 0;
    
    // Calculate average progress from thumbnails
    const totalProgress = job.thumbnails.reduce((sum, thumb) => sum + (thumb.progress || 0), 0);
    return Math.round(totalProgress / job.thumbnails.length);
  };

  return (
    <div ref={lazyRef} className={styles.jobGroup}>
      {/* Job Header */}
      <div className={styles.jobHeader}>
        <div className={styles.jobTitle}>
          <h3 className={styles.shootTitle}>SHOOT #{shootNumber.toString().padStart(3, '0')}</h3>
          <div className={styles.jobMeta}>
            <span className={styles.timeAgo}>{getTimeAgo(job.createdAt)}</span>
            <span className={styles.separator}>•</span>
            <span className={`${styles.status} ${styles[`status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`]}`}>
              {getStatusDisplay()}
            </span>
            {job.status === 'running' && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.progress}>{getProgress()}%</span>
              </>
            )}
          </div>
        </div>
        
        {/* Job Options Summary */}
        <div className={styles.jobOptions}>
          <span className={styles.optionItem}>{job.nbTakes} images</span>
          {/* Add more options here when available from job data */}
        </div>
      </div>

      {/* Thumbnails Grid - Only render when visible or loading */}
      <div className={styles.thumbnailGrid}>
        {isVisible ? (
          job.thumbnails.map((thumbnail, index) => (
            <InferenceThumbnailComponent
              key={thumbnail.id}
              thumbnail={thumbnail}
              onClick={() => handleThumbnailClick(index)}
            />
          ))
        ) : (
          // Render placeholder thumbnails when not visible to maintain layout
          job.thumbnails.map((thumbnail, index) => (
            <div
              key={`placeholder-${thumbnail.id}`}
              className={styles.thumbnailPlaceholder}
              aria-label={`Thumbnail ${index + 1} placeholder`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default InferenceJobGroup;
