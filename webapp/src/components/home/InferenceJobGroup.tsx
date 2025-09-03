'use client';

import { FC, useMemo } from 'react';
import { InferenceThumbnailComponent } from './InferenceThumbnail';
import { InferenceImageViewerDialog } from './InferenceImageViewerDialog';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { useLazyImage } from '@/hooks/useLazyLoading';
import { useStyle, useScene, useWardrobe, useColor, useSceneById, useWardrobeById, useColorById } from '@/hooks/useConfig';
import { useTranslation } from 'react-i18next';
import styles from './InferenceJobGroup.module.css';
import { Icon } from '@primeshot/common/web/Icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { useInferenceQueue } from '@/contexts/inference-queue-context';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { Button } from '@primeshot/common/web/ui/button';

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
  const { t } = useTranslation(['styles']);
  const { removeJob } = useInferenceQueue();
  const { toast } = useToast();

  // Helper to detect UUID vs value codes
  const isUuid = (v?: string) => !!v && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(v);

  // Load labels for subtitle (style always by id)
  const { data: styleData } = useStyle(job.styleId as any);

  // Scene: resolve by id if UUID, otherwise by value
  const sceneId = job.sceneId || '';
  const wardrobeId = job.wardrobeId || '';
  const colorId = job.colorId || '';

  const useSceneHook = isUuid(sceneId) ? useSceneById : useScene;
  const useWardrobeHook = isUuid(wardrobeId) ? useWardrobeById : useWardrobe;
  const useColorHook = isUuid(colorId) ? useColorById : useColor;

  const { data: sceneData } = useSceneHook(sceneId || undefined as any);
  const { data: wardrobeData } = useWardrobeHook(wardrobeId || undefined as any);
  const { data: colorData } = useColorHook(colorId || undefined as any);

  const subtitle = useMemo(() => {
    const style = styleData?.name || '';
    const scene = (sceneData as any)?.label || '';
    const wardrobe = (wardrobeData as any)?.label || '';
    const color = (colorData as any)?.label || '';
    // Only render when all parts are available to avoid partial phrases
    if (!style || !scene || !wardrobe || !color) return '';
    return t('shoot.subtitle', { ns: 'styles', style, scene, wardrobe, color });
  }, [styleData?.name, (sceneData as any)?.label, (wardrobeData as any)?.label, (colorData as any)?.label, t]);

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

  // Get localized status label for the badge (do not show raw message here)
  const getStatusDisplay = () => {
    const raw = job.status || '';
    const normalized = raw === 'running' ? 'generating' : raw;
    const fallback = normalized ? (normalized.charAt(0).toUpperCase() + normalized.slice(1)) : '';
    return t(`status.badge.${normalized}` as any, { ns: 'styles', defaultValue: fallback });
  };

  // Get progress if available
  const getProgress = () => {

          const now = Date.now();
      
      // Use a stored start time for animation, or current time if first render
      const animationKey = `animation_start_${job.id}`;
      let animationStartTime = parseInt(sessionStorage.getItem(animationKey) || '0');
      
      if (!animationStartTime) {
        animationStartTime = now;
        sessionStorage.setItem(animationKey, animationStartTime.toString());
      }
      
      const elapsed = now - animationStartTime;
    const jobHash = job.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const totalDuration = 60000 + (jobHash % 20000);
    const rawProgress = Math.min(elapsed / totalDuration, 1);
    const curvedProgress = 100 * (1 - Math.exp(-3 * rawProgress));
    
    return Math.round(curvedProgress); // Let it reach 100% naturally
  };

  const renderStatusBadge = () => {
    const statusKey = job.status.charAt(0).toUpperCase() + job.status.slice(1);
    const statusClass = `${styles.status} ${styles[`status${statusKey}`]}`;

    const content = (
      <span className={statusClass}>
        <span className={styles.statusText}>
          {(job.status === 'queued' || job.status === 'pending') && (
            <Icon variant="info" size={16} />
          )}
          {getStatusDisplay()}
          {job.status === 'starting' && (
            <span className={styles.progress}>({getProgress()}%)</span>
          )}
        </span>
        {job.status !== 'queued' && job.status !== 'failed' && (
          <span className={styles.dots}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </span>
        )}
      </span>
    );

    if (job.status === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top">
              {job.message || 'Generation failed'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (job.status === 'pending' || job.status === 'queued') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top">
              {job.status === 'pending'
                ? t('status.tooltip.pending', { ns: 'styles' })
                : (job.message || t('status.tooltip.queued', { ns: 'styles' }))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const handleDelete = async () => {
    try {
      const ok = await (await import('@/lib/services/confirmationService')).confirmationService.confirm({
        title: 'Delete shoot?',
        description: 'This will remove the failed job from your gallery. This cannot be undone.',
        confirmText: 'Delete',
        variant: 'danger',
        icon: 'bin'
      });
      if (!ok) return;
      const { deleteInferenceJob } = await import('@/lib/api/inference-job-management');
      await deleteInferenceJob(job.id, { soft: true });
      removeJob(job.id);
      toast({ title: 'Deleted', description: 'The failed shoot was removed.' });
    } catch (e) {
      console.error('Failed to delete job', e);
      toast({ title: 'Delete failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div ref={lazyRef} className={styles.jobGroup}>
      {/* Job Header */}
      <div className={styles.jobHeader}>
        <div className={styles.jobTitle}>
          <div className={styles.titleRow}>
            <h3 className={styles.shootTitle}>SHOOT #{shootNumber.toString().padStart(3, '0')}</h3>
            <span className={styles.dotsMenuButton}><Icon variant="dotsMenu" size={16} /></span>
            {!!subtitle && <span className={styles.jobSubtitle}>{subtitle}</span>}
          </div>
          <div className={styles.jobMeta}>
            {job.status === 'failed' && (
              <Button variant="ghost" className={`${styles.dotsMenuButton} ${styles.actionBtn}`} onClick={handleDelete} aria-label="Delete job">
                <Icon variant="bin" size={16} />
              </Button>
            )}
            {job.status === 'completed' && (
              <span className={styles.timeAgo}>{getTimeAgo(job.createdAt)}</span>
            )}
            {(job.status !== 'completed') && (
              renderStatusBadge()
            )}
          </div>
        </div>
      </div>

      {/* Thumbnails Grid - Only render when visible or loading */}
      <div className={styles.thumbnailGrid}>
        {isVisible ? (
          job.thumbnails.map((thumbnail, index) => (
            <InferenceThumbnailComponent
              key={thumbnail.id}
              thumbnail={thumbnail}
              jobStatus={job.status as any}
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
