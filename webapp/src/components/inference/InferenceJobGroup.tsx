'use client';

import { FC, useMemo, useState, useEffect } from 'react';
import { InferenceThumbnailComponent } from './InferenceThumbnail';
import { InferenceImageViewerDialog } from './InferenceImageViewerDialog';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { useLazyImage } from '@/hooks/useLazyLoading';
import { useStyle, useScene, useWardrobe, useColor, useSceneById, useWardrobeById, useColorById } from '@/hooks/useConfig';
import { useTranslatedScene, useTranslatedWardrobe, useTranslatedColor } from '@/hooks/useTranslatedStyles';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import styles from './InferenceJobGroup.module.css';
import { Icon } from '@primeshot/common/web/Icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { useInferenceQueue } from '@/contexts/inference-queue-context';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { Button } from '@primeshot/common/web/ui/button';
import { confirmationService } from '@/lib/services/confirmationService';
import { useJobsApi } from '@/lib/api/jobs';
import { getStyleImages } from '@/lib/utils/get-styles-images';
import { useCreditGuard } from '@/hooks/useCreditGuard';
import { calculateImageCredits, useCreditCosts } from '@/hooks/usePricingConfig';

interface InferenceJobGroupProps {
  job: InferenceJob;
  shootNumber: number;
}

export const InferenceJobGroup: FC<InferenceJobGroupProps> = ({ job, shootNumber }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { openDialog } = useDialogService();
  const { ref: lazyRef, isVisible } = useLazyImage({
    rootMargin: '300px', // Load images 300px before they come into view
    threshold: 0.1
  });
  const { t } = useTranslation(['styles', 'inference']);
  const inferenceQueue = useInferenceQueue();
  const { removeJob, createQueuedThumbnails, updateJobWithRealId, updateJobStatus } = inferenceQueue;
  const { toast } = useToast();
  const { startInference } = useJobsApi();
  const { user } = useAuth();

  // Use live-updating job from queue context if available
  const activeJob = useMemo(() => {
    const jobs = inferenceQueue?.jobs;
    return jobs?.find(j => j.id === job.id) || job;
  }, [inferenceQueue?.jobs, job]);

  // Credit validation for rerun action (must come after activeJob is defined)
  const { data: creditCosts, isLoading: isLoadingCreditCosts } = useCreditCosts();
  const requiredCredits = useMemo(() => {
    if (!activeJob.quality || !activeJob.nbTakes) return 0;
    return calculateImageCredits(activeJob.quality, activeJob.nbTakes, creditCosts) || 0;
  }, [activeJob.quality, activeJob.nbTakes, creditCosts]);
  const guard = useCreditGuard(requiredCredits);

  // Helper to detect UUID vs value codes
  const isUuid = (v?: string) => !!v && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(v);

  // Load labels for subtitle (style always by id)
  const { data: styleData, isLoading: styleLoading } = useStyle(activeJob.styleId as any);

  // Scene: resolve by id if UUID, otherwise by value
  const sceneId = activeJob.sceneId || '';
  const wardrobeId = activeJob.wardrobeId || '';
  const colorId = activeJob.colorId || '';

  const useSceneHook = isUuid(sceneId) ? useSceneById : useScene;
  const useWardrobeHook = isUuid(wardrobeId) ? useWardrobeById : useWardrobe;
  const useColorHook = isUuid(colorId) ? useColorById : useColor;

  const { data: sceneData, isLoading: sceneLoading } = useSceneHook(sceneId || undefined as any);
  const { data: wardrobeData, isLoading: wardrobeLoading } = useWardrobeHook(wardrobeId || undefined as any);
  const { data: colorData, isLoading: colorLoading } = useColorHook(colorId || undefined as any);

  // Get translated versions of the data
  const translatedScene = useTranslatedScene(sceneData);
  const translatedWardrobe = useTranslatedWardrobe(wardrobeData);
  const translatedColor = useTranslatedColor(colorData);

  // Extract style background image for thumbnails
  const styleBackgroundImage = useMemo(() => {
    return styleData?.preview_images?.[0] || '';
  }, [styleData?.preview_images]);

  // Delayed background image to prevent flickering
  const [delayedBackgroundImage, setDelayedBackgroundImage] = useState<string>('');

  useEffect(() => {
    // Only show background image if job is not completed
    if (styleBackgroundImage && activeJob.status !== 'completed') {
      // Delay applying the background image to prevent flickering
      const timer = setTimeout(() => {
        setDelayedBackgroundImage(styleBackgroundImage);
      }, 500); // 500ms delay
      return () => clearTimeout(timer);
    } else {
      // Remove background if job is completed or no image available
      setDelayedBackgroundImage('');
    }
  }, [styleBackgroundImage, activeJob.status]);

  const subtitle = useMemo(() => {
    // Prefer prompt_override when available and enabled
    const rawOverride = (activeJob as any)?.prompt_override ?? (activeJob as any)?.promptOverride ?? null;
    let overrideObj: any = null;
    if (rawOverride) {
      if (typeof rawOverride === 'string') {
        try { overrideObj = JSON.parse(rawOverride); } catch { overrideObj = null; }
      } else if (typeof rawOverride === 'object') {
        overrideObj = rawOverride;
      }
    }
    const overridePrompt = (overrideObj?.enabled === true && typeof overrideObj?.prompt === 'string')
      ? overrideObj.prompt.trim()
      : '';
    if (overridePrompt) return overridePrompt;

    // Show loading indicator if any data is still loading
    const isLoading = styleLoading || sceneLoading || wardrobeLoading || colorLoading;
    if (isLoading) {
      return t('common:loading', { defaultValue: 'Loading...' });
    }

    // Fallback to composed subtitle when override is not present
    const style = styleData?.name || '';
    const scene = (translatedScene?.label || '').toLowerCase();
    const wardrobe = (translatedWardrobe?.label || '').toLowerCase();
    const color = (translatedColor?.label || '').toLowerCase();
        
    // Return partial subtitle if some data is available, or empty if none
    if (!style && !scene && !wardrobe && !color) return '';
    
    // If we have all data, use the full translation
    if (style && scene && wardrobe && color) {
      return t('shoot.subtitle', { ns: 'styles', style, scene, wardrobe, color });
    }
    
    // Fallback: show available parts
    const parts = [style, scene, wardrobe, color].filter(Boolean);
    return parts.join(' • ');
  }, [
    styleData?.name,
    (sceneData as any)?.label,
    (wardrobeData as any)?.label,
    (colorData as any)?.label,
    (activeJob as any)?.prompt_override,
    (activeJob as any)?.promptOverride,
    activeJob.styleId,
    activeJob.sceneId,
    activeJob.wardrobeId,
    activeJob.colorId,
    styleLoading,
    sceneLoading,
    wardrobeLoading,
    colorLoading,
    t
  ]);

  // Filter out deleted/failed thumbnails that have no image URLs (same logic as in viewer dialog)
  const visibleThumbnails = useMemo(() => {
    return activeJob.thumbnails.filter(thumb => {
      // Keep thumbnails that have images or are still generating
      return thumb.webImageUrl || thumb.imageUrl || 
             (thumb.status === 'running' || thumb.status === 'queued');
    });
  }, [activeJob.thumbnails]);

  // Handle thumbnail click to open fullscreen viewer
  const handleThumbnailClick = (thumbnailIndex: number) => {
    // Only open dialog for completed images
    if (activeJob.thumbnails[thumbnailIndex]?.status === 'completed') {
      // Convert original array index to filtered array index
      const clickedThumbnail = activeJob.thumbnails[thumbnailIndex];
      const filteredIndex = visibleThumbnails.findIndex(thumb => thumb.id === clickedThumbnail.id);
      
      if (filteredIndex !== -1) {
        openDialog(
          <InferenceImageViewerDialog
            job={activeJob}
            initialImageIndex={filteredIndex}
            fullscreen={true}
            noContainer={true}
            hideHeader={true}
            shootNumber={shootNumber}
          />
        );
      }
    }
  };

  // Calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('inference:time.justNow');
    if (diffInMinutes < 60) return t('inference:time.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('inference:time.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    return t('inference:time.daysAgo', { count: diffInDays });
  };

  // Get localized status label for the badge (do not show raw message here)
  const getStatusDisplay = () => {
    const raw = activeJob.status || '';
    const normalized = raw === 'running' ? 'generating' : raw;
    const fallback = normalized ? (normalized.charAt(0).toUpperCase() + normalized.slice(1)) : '';
    return t(`status.badge.${normalized}` as any, { ns: 'styles', defaultValue: fallback });
  };

  // Simplify error messages for user-friendly display
  const getSimplifiedErrorMessage = (rawMessage?: string) => {
    if (!rawMessage) return t('group.error.generic', { ns: 'inference', defaultValue: 'Error generating images, credits refunded' });
    
    const message = rawMessage.toLowerCase();
    
    // Check for specific error patterns and return user-friendly messages
    if (message.includes('timeout') || message.includes('timed out')) {
      return t('group.error.timeout', { ns: 'inference', defaultValue: 'Generation took too long, credits refunded' });
    }
    
    if (message.includes('queue stuck') || message.includes('all methods exhausted')) {
      return t('group.error.serverBusy', { ns: 'inference', defaultValue: 'Server was busy, credits refunded' });
    }
    
    if (message.includes('memory') || message.includes('cuda') || message.includes('out of memory')) {
      return t('group.error.memory', { ns: 'inference', defaultValue: 'Server overloaded, credits refunded' });
    }
    
    if (message.includes('connection') || message.includes('network')) {
      return t('group.error.connection', { ns: 'inference', defaultValue: 'Connection issue, credits refunded' });
    }
    
    if (message.includes('image') && message.includes('generation failed')) {
      return t('group.error.imageGeneration', { ns: 'inference', defaultValue: 'Image generation failed, credits refunded' });
    }
    
    // Default fallback for any other error
    return t('group.error.generic', { ns: 'inference', defaultValue: 'Error generating images, credits refunded' });
  };

  // State to trigger re-renders for progress animation
  const [, forceUpdate] = useState({});

  // Get progress if available
  const getProgress = () => {
    const now = Date.now();

    // Reset the animation when status changes by including it in the key
    const animationKey = `animation_start_${activeJob.id}_${activeJob.status}`;
    let animationStartTime = parseInt(sessionStorage.getItem(animationKey) || '0', 10);

    if (!animationStartTime) {
      animationStartTime = now;
      sessionStorage.setItem(animationKey, animationStartTime.toString());
    }

    const elapsed = now - animationStartTime;
    const jobHash = activeJob.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const totalDuration = 90000 + (jobHash % 15000); // 90–105s range per job (1.5–1.75 minutes)

    // Linear ramp from 0 to 95% over the duration
    const linear = Math.min(elapsed / totalDuration, 0.99);
    return Math.floor(linear * 100);
  };

  // Update progress animation every second for active jobs
  useEffect(() => {
    if (activeJob.status === 'starting') {
      const interval = setInterval(() => {
        forceUpdate({}); // Trigger re-render to update progress
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [activeJob.status, activeJob.id]);

  const renderStatusBadge = () => {
    const statusKey = activeJob.status.charAt(0).toUpperCase() + activeJob.status.slice(1);
    const statusClass = `${styles.status} ${styles[`status${statusKey}`]}`;

    const content = (
      <span className={statusClass}>
        <span className={styles.statusText}>
          {(activeJob.status === 'queued' || activeJob.status === 'pending') && (
            <Icon variant="info" size={16} />
          )}
          {getStatusDisplay()}
          {(activeJob.status === 'starting') && (
            <span className={styles.progress}>({getProgress()}%)</span>
          )}
        </span>
        {activeJob.status !== 'queued' && activeJob.status !== 'failed' && (
          <span className={styles.dots}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </span>
        )}
      </span>
    );

    if (activeJob.status === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top">
              {getSimplifiedErrorMessage(activeJob.message)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (activeJob.status === 'pending' || activeJob.status === 'queued') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="top">
              {activeJob.status === 'pending'
                ? t('status.tooltip.pending', { ns: 'styles' })
                : (activeJob.message || t('status.tooltip.queued', { ns: 'styles' }))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  const handleDelete = async () => {
    try {
      const ok = await confirmationService.confirm({
        title: t('group.confirmDelete.title', { ns: 'inference' }),
        description: t('group.confirmDelete.description', { ns: 'inference' }),
        confirmText: t('group.confirmDelete.confirm', { ns: 'inference' }),
        variant: 'destructive',
        icon: 'bin'
      });
      if (!ok) return;
      
      // Start the delete animation
      setIsDeleting(true);
      
      const { deleteInferenceJob } = await import('@/lib/api/inference-job-management');
      await deleteInferenceJob(activeJob.id, { soft: true });
      removeJob(activeJob.id);
    } catch (e) {
      console.error('Failed to delete job', e);
      setIsDeleting(false); // Reset animation state on error
      toast({ title: t('group.deleteFailedTitle', { ns: 'inference' }), description: t('common.pleaseTryAgain', { ns: 'inference' }), variant: 'destructive', duration: 4000 });
    }
  };

  const handleRerun = async () => {
    try {
      // Extract parameters from the current job to recreate it
      // We need to ensure all required fields are present
      if (!activeJob.characterId || !activeJob.styleId) {
        toast({ 
          title: t('group.rerun.cannot', { ns: 'inference' }), 
          description: t('group.rerun.missingInfo', { ns: 'inference' }), 
          variant: 'destructive', 
          duration: 4000 
        });
        return;
      }

      // Convert UUIDs back to values for inference-create API
      // The backend expects value strings, not UUIDs
      // Use the already loaded data from the hooks above
      let sceneValue = '';
      let wardrobeValue = '';
      let colorValue = '';

      // Use the data that's already been loaded by the hooks
      if (activeJob.sceneId && isUuid(activeJob.sceneId)) {
        sceneValue = (sceneData as any)?.value || '';
      } else {
        sceneValue = activeJob.sceneId || '';
      }

      if (activeJob.wardrobeId && isUuid(activeJob.wardrobeId)) {
        wardrobeValue = (wardrobeData as any)?.value || '';
      } else {
        wardrobeValue = activeJob.wardrobeId || '';
      }

      if (activeJob.colorId && isUuid(activeJob.colorId)) {
        colorValue = (colorData as any)?.value || '';
      } else {
        colorValue = activeJob.colorId || '';
      }

      const request = {
        user_id: user?.id || '',
        character_id: activeJob.characterId,
        style_id: activeJob.styleId,
        wardrobe_id: wardrobeValue,
        color_id: colorValue,
        scene_id: sceneValue,
        params: {
          nb_takes: activeJob.nbTakes || 1,
          quality: activeJob.quality,
          aspect_ratio: activeJob.aspectRatio,
        },
      };

      // Wrap with credit guard to validate credits before starting
      await guard(async () => {
        let placeholderId: string | null = null;
        
        try {
          // Create placeholder thumbnails first (this is what shows the loading UI)
          placeholderId = createQueuedThumbnails(activeJob.nbTakes || 1, {
            styleId: activeJob.styleId,
            sceneId: sceneValue,
            wardrobeId: wardrobeValue,
            colorId: colorValue,
            aspectRatio: activeJob.aspectRatio,
            quality: activeJob.quality,
          });

          const data = await startInference(request);
          
          // Handle the response to connect placeholder with real job
          const realJobId = (data as any)?.job_id;
          const responseStatus = (data as any)?.status;
          
          if (realJobId && placeholderId) {
            // Update thumbnails with real job ID
            updateJobWithRealId(placeholderId, realJobId);
            
            // Update status based on response
            if (responseStatus) {
              updateJobStatus(realJobId, responseStatus);
            }
          }

          // Show success toast
          toast({
            title: t('group.rerun.started', { ns: 'inference', defaultValue: 'Generation started' }),
            duration: 3000
          });

        } catch (err) {
          // Mark placeholder as failed on API error
          if (placeholderId) {
            try { 
              updateJobStatus(placeholderId, 'failed' as any); 
            } catch {}
          }
          throw err;
        }
      })();

    } catch (e) {
      console.error('Failed to rerun job', e);
      
      // Handle insufficient credits specifically
      const msg = (e as any)?.message || '';
      if (typeof msg === 'string' && (msg.includes('Insufficient credits') || msg.includes('402'))) {
        toast({
          title: t('group.rerun.insufficientCredits', { ns: 'inference', defaultValue: 'Not enough credits' }),
          description: t('group.rerun.insufficientCreditsDesc', { ns: 'inference', defaultValue: 'Please purchase more credits to continue.' }),
          variant: 'destructive',
          duration: 5000
        });
      } else {
        // Generic error toast
        toast({ 
          title: t('group.rerun.failed', { ns: 'inference' }), 
          description: t('common.pleaseTryAgain', { ns: 'inference' }), 
          variant: 'destructive', 
          duration: 4000 
        });
      }
    }
  };

  // Determine aspect ratio class immediately, even for freshly created placeholder jobs
  const runtimeAR = useMemo(() => {
    if (activeJob.aspectRatio) return activeJob.aspectRatio;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('generation-controls-aspect-ratio') : null;
      const v = raw ? JSON.parse(raw) : '';
      return typeof v === 'string' ? v : '';
    } catch {
      return '';
    }
  }, [activeJob.aspectRatio]);

  return (
    <div ref={lazyRef} className={styles.jobGroup + (isDeleting ? ' ' + styles.deleting : '')}>
      {/* Job Header */}
      <div className={styles.jobHeader}>
        <div className={styles.jobTitle}>
          <div className={styles.titleRow}>
            <h3 className={styles.shootTitle}>{t('group.header.shootTitle', { ns: 'inference', number: shootNumber.toString().padStart(3, '0') })}</h3>
            <span className={styles.dotsMenuButton}><Icon variant="dotsMenu" size={16} /></span>
            {!!subtitle && <span className={styles.jobSubtitle}>{subtitle}</span>}
          </div>
          <div className={styles.jobMeta}>
            <div className={styles.jobMetaButtons}>
              {(activeJob.status === 'completed' || activeJob.status === 'failed') && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className={`${styles.dotsMenuButton} ${styles.actionBtn}`} onClick={handleDelete} aria-label={t('group.tooltips.deleteShoot', { ns: 'inference' })}>
                      <Icon variant="bin" size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t('group.tooltips.deleteShoot', { ns: 'inference' })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`${styles.dotsMenuButton} ${styles.actionBtn}`} 
                      onClick={handleRerun} 
                      disabled={isLoadingCreditCosts || !requiredCredits}
                      aria-label={t('group.tooltips.rerunShoot', { ns: 'inference' })}
                    >
                      <Icon variant="restart" size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t('group.tooltips.rerunShoot', { ns: 'inference' })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {activeJob.status === 'completed' && (
              <span className={styles.timeAgo}>{getTimeAgo(activeJob.createdAt)}</span>
            )}
            {(activeJob.status !== 'completed') && (
              renderStatusBadge()
            )}
          </div>
        </div>
      </div>

      {/* Mobile hero layout (<768px) */}
      <div
        className={[
          styles.mobileHeroWrap,
          runtimeAR === '2:3' ? styles.ar23 : '',
          runtimeAR === '3:2' ? styles.ar32 : '',
          runtimeAR === '1:1' ? styles.ar11 : ''
        ].filter(Boolean).join(' ')}
      >
        <div className={[
          styles.mobileHero,
          runtimeAR === '2:3' ? styles.ar23 : '',
          runtimeAR === '3:2' ? styles.ar32 : '',
          runtimeAR === '1:1' ? styles.ar11 : ''
        ].filter(Boolean).join(' ')}
        style={delayedBackgroundImage ? {
          backgroundImage: `url(${getStyleImages([delayedBackgroundImage])})`,
          backgroundSize: '180%',
          backgroundPosition: 'left bottom',
        } : undefined}
        >
          <div className={styles.heroAspect}>
            {(() => {
              const firstThumb = activeJob.thumbnails[0];
              return (
                <InferenceThumbnailComponent
                  key={firstThumb?.id}
                  thumbnail={firstThumb}
                  jobStatus={activeJob.status as any}
                  onClick={() => handleThumbnailClick(0)}
                  variant="hero"
                />
              );
            })()}
          </div>

          {/* Bottom-left stacked preview circles */}
          {(() => {
            // Show all thumbnails, including deleted ones (empty squares)
            const allThumbnails = activeJob.thumbnails;
            // Exclude the first (hero) thumbnail; show remaining as circles
            const remaining = allThumbnails.slice(1);
            const display = remaining.slice(0, 4);
            const extra = Math.max(remaining.length - display.length, 0);
            
            return (
            <div className={styles.previewStack} aria-label={t('group.aria.thumbnailsPreview', { ns: 'inference' })}>
                {display.map((thumbnail, idx) => (
                  (thumbnail.webImageUrl || thumbnail.imageUrl) && (
                    <div key={`pv-${thumbnail.id}`} className={styles.previewCircle}>
                      <img src={(thumbnail.webImageUrl || thumbnail.imageUrl) as string} alt={t('group.alt.preview', { ns: 'inference', index: idx + 1 })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )
                ))}
                {extra > 0 && (
                  <div className={`${styles.previewCircle} ${styles.moreCircle}`} style={{ zIndex: 10 }}>
                    {`+${extra}`}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom-right View all button */}
          <Button
            variant="secondary"
            className={styles.viewAllBtn}
            size="md"
            onClick={() => handleThumbnailClick(0)}
            aria-label={t('group.aria.viewAllImages', { ns: 'inference' })}
          >
            {t('group.buttons.viewAll', { ns: 'inference' })}
          </Button>
        </div>
      </div>

      {/* Thumbnails Grid - desktop and tablets */}
      <div 
        className={[
          styles.thumbnailGrid,
          runtimeAR === '2:3' ? styles.ar23 : '',
          runtimeAR === '3:2' ? styles.ar32 : '',
          runtimeAR === '1:1' ? styles.ar11 : ''
        ].filter(Boolean).join(' ')}
        style={delayedBackgroundImage ? {
          backgroundImage: `url(${getStyleImages([delayedBackgroundImage])})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {isVisible ? (
          activeJob.thumbnails.map((thumbnail, index) => (
            <InferenceThumbnailComponent
              key={thumbnail.id}
              thumbnail={thumbnail}
              jobStatus={activeJob.status as any}
              onClick={() => handleThumbnailClick(index)}
              showQuotes={index === activeJob.thumbnails.length - 1}
            />
          ))
        ) : (
          // Render placeholder thumbnails when not visible to maintain layout
          activeJob.thumbnails.map((thumbnail, index) => (
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
