'use client';

import { FC, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import styles from './InferenceThumbnail.module.css';
import { getInferenceImageThumbnail, getInferenceImageCard } from '@/lib/utils/get-inference-image';
import { Icon } from '@primeshot/common/web/Icon';
import { Button } from '@primeshot/common/web/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { Loader } from '@primeshot/common/web/ui/loader';
import { useOptionalInferenceQueue } from '@/contexts/inference-queue-context';
import { confirmationService } from '@/lib/services/confirmationService';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '@primeshot/common/lib/api/client';

export interface InferenceThumbnail {
  id: string;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  imageUrl?: string;
  webImageUrl?: string;
  // Database generated_images.id to allow updates like favourite toggles
  imageId?: string;
  // Whether this image is marked as favourite in DB
  favourite?: boolean;
  index: number;
  progress?: number;
  errorMessage?: string;
}

interface InferenceThumbnailProps {
  thumbnail: InferenceThumbnail;
  jobStatus?: 'queued' | 'pending' | 'running' | 'completed' | 'failed' | 'initializing' | 'generating' | 'starting';
  onClick?: () => void;
  /**
   * Rendering variant:
   * - 'grid' (default): small thumbs in rows
   * - 'hero': single large mobile hero (should request up to 1024w)
   */
  variant?: 'grid' | 'hero';
  /**
   * If true, this is the last thumbnail and should show rotating quotes during generation
   */
  showQuotes?: boolean;
}

export const InferenceThumbnailComponent: FC<InferenceThumbnailProps> = ({
  thumbnail,
  jobStatus,
  onClick,
  variant = 'grid',
  showQuotes = false
}) => {
  const { t } = useTranslation('inference');
  // Track layered transition state between preview and final image
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(thumbnail.webImageUrl || thumbnail.imageUrl);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [finalLoaded, setFinalLoaded] = useState(false);
  const [startZoom, setStartZoom] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasMountedRef = useRef(false);
  const zoomTriggeredRef = useRef(false);
  
  // Quote rotation state (only used if showQuotes is true)
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  
  // Check if we're using a base64 preview
  const isBase64Preview = (thumbnail.webImageUrl || thumbnail.imageUrl)?.startsWith('data:image/');

  // When incoming URL changes, preserve previous to enable crossfade
  useEffect(() => {
    const nextUrl = thumbnail.webImageUrl || thumbnail.imageUrl;
    
    // Handle case where image is deleted (nextUrl becomes undefined)
    if (!nextUrl) {
      if (currentUrl || prevUrl) {
        setPrevUrl(null);
        setCurrentUrl(undefined);
        setFinalLoaded(false);
      }
      return;
    }
    
    if (!currentUrl) {
      setCurrentUrl(nextUrl);
      return;
    }
    if (nextUrl !== currentUrl) {
      setPrevUrl(currentUrl);
      setCurrentUrl(nextUrl);
      setFinalLoaded(false);
    }
  }, [thumbnail.webImageUrl, thumbnail.imageUrl, currentUrl, prevUrl]);

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
      // Trigger zoom only on the very first mount (no crossfade)
      if (!hasMountedRef.current && !prevUrl) {
        setStartZoom(true);
        zoomTriggeredRef.current = true;
      }
    }, 200);
  }, [prevUrl]);
  
  const handleImageError = useCallback((e: any) => {
    console.error(`❌ Image failed to load: ${thumbnail.webImageUrl || thumbnail.imageUrl}`, e);
    setImageError(true);
    setFinalLoaded(false);
  }, [thumbnail.webImageUrl, thumbnail.imageUrl]);
  
  const getStatusClass = () => {
    switch (thumbnail.status) {
      case 'queued': {
        // Distinguish queued because job is queued vs queued while job is running
        if (jobStatus === 'running' || jobStatus === 'pending' || jobStatus === 'initializing' || jobStatus === 'generating' || jobStatus === 'starting') {
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
  const shouldZoomOnMount = startZoom;
  useEffect(() => { hasMountedRef.current = true; }, []);

  // If images are already cached and onLoad fires immediately or is skipped, ensure we still trigger zoom once
  useEffect(() => {
    if (!zoomTriggeredRef.current && currentUrl && !prevUrl) {
      setTimeout(() => {
        setStartZoom(true);
        zoomTriggeredRef.current = true;
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove zoomOnMount class after animation completes to enable smooth hover transitions
  useEffect(() => {
    if (startZoom) {
      const timer = setTimeout(() => {
        setStartZoom(false);
      }, 600); // Match the fadeInScale animation duration (0.6s)
      return () => clearTimeout(timer);
    }
  }, [startZoom]);

  const hasAnyImage = Boolean(currentUrl || prevUrl);
  const showDualLayer = Boolean(prevUrl && currentUrl && currentUrl !== prevUrl && !finalLoaded);
  const objectFit = variant === 'hero' ? 'cover' : 'contain';

  // Get quotes from translation
  const quotes = useMemo(() => {
    if (!showQuotes) return [];
    const quotesArray = t('gallery.quotes', { returnObjects: true });
    return Array.isArray(quotesArray) ? quotesArray : [];
  }, [t, showQuotes]);

  // Quote rotation animation: fade out, switch quote, fade in
  // Only show during generation (running/starting/initializing states)
  useEffect(() => {
    if (!showQuotes || quotes.length === 0) return;
    
    const isGenerating = jobStatus === 'running' || 
                        jobStatus === 'starting' || 
                        jobStatus === 'initializing' ||
                        jobStatus === 'generating';
    
    if (!isGenerating) return;

    const getRandomQuoteIndex = (currentIndex: number): number => {
      if (quotes.length <= 1) return 0;
      
      // Get a random index that's different from current
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * quotes.length);
      } while (newIndex === currentIndex);
      
      return newIndex;
    };

    const cycleQuote = () => {
      // Fade out
      setQuoteVisible(false);
      
      // Wait for fade out, then change quote to a random one
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => getRandomQuoteIndex(prev));
        // Fade back in
        setQuoteVisible(true);
      }, 500); // Duration of fade out
    };

    // Show first quote for full duration, then start cycling
    const interval = setInterval(cycleQuote, 7000); // 7 seconds per quote

    return () => clearInterval(interval);
  }, [showQuotes, jobStatus, quotes.length]);

  // Check if we should show the quote overlay
  const shouldShowQuoteOverlay = showQuotes && 
    quotes.length > 0 && 
    (jobStatus === 'running' || jobStatus === 'starting' || jobStatus === 'initializing' || jobStatus === 'generating');

  // Inline action state
  const queue = useOptionalInferenceQueue();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingToExplore, setIsSavingToExplore] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isInExplore, setIsInExplore] = useState(false);
  const [localFavourite, setLocalFavourite] = useState(Boolean(thumbnail.favourite));
  useEffect(() => { setLocalFavourite(Boolean(thumbnail.favourite)); }, [thumbnail.favourite]);
  
  // Check if user is admin
  const isAdmin = user?.admin === true;

  // Check if image is in explore on mount
  useEffect(() => {
    if (!isAdmin || !thumbnail.imageId) return;
    
    const checkExploreStatus = async () => {
      try {
        const response = await fetch(getApiUrl(`/api/admin/explore/check?generatedImageId=${thumbnail.imageId}`));
        if (response.ok) {
          const data = await response.json();
          setIsInExplore(data.isInExplore || false);
        }
      } catch (error) {
        console.error('Failed to check explore status:', error);
      }
    };
    
    checkExploreStatus();
  }, [isAdmin, thumbnail.imageId]);

  const handleToggleFavourite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thumbnail.imageId) return;
    if (isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      const next = !localFavourite;
      setLocalFavourite(next);
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { favourite: next });
      const { setImageFavourite } = await import('@/lib/api/inference-images');
      await setImageFavourite(thumbnail.imageId, next);
      // Update favourites count cache and invalidate so header updates
      try {
        const key = ['favouriteCount', user?.id];
        queryClient.setQueryData<number>(key, (prev) => {
          const base = typeof prev === 'number' ? prev : 0;
          return Math.max(0, base + (next ? 1 : -1));
        });
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['favouriteCount'] });
    } catch {
      setLocalFavourite(Boolean(thumbnail.favourite));
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { favourite: Boolean(thumbnail.favourite) });
    } finally {
      setIsTogglingFav(false);
    }
  }, [thumbnail.imageId, thumbnail.favourite, thumbnail.jobId, thumbnail.index, queue, isTogglingFav, localFavourite]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const base = thumbnail.imageUrl || thumbnail.webImageUrl;
    if (!base) return;
    setIsDownloading(true);
    try {
      const response = await fetch(base);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `primeshot-${thumbnail.jobId.slice(0, 8)}-img-${(thumbnail.index + 1).toString().padStart(2, '0')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  }, [thumbnail.imageUrl, thumbnail.webImageUrl, thumbnail.jobId, thumbnail.index]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thumbnail.imageId) {
      toast({ title: t('thumbnail.loadingTitle', { ns: 'inference' }), description: t('thumbnail.loadingDesc', { ns: 'inference' }) });
      return;
    }
    const ok = await confirmationService.confirm({
      title: t('thumbnail.confirmDelete.title', { ns: 'inference' }),
      description: t('thumbnail.confirmDelete.description', { ns: 'inference' }),
      confirmText: t('thumbnail.confirmDelete.confirm', { ns: 'inference' }),
      variant: 'destructive',
      icon: 'bin'
    });
    if (!ok) return;
    setIsDeleting(true);
    try {
      const { deleteGeneratedImage } = await import('@/lib/api/inference-images');
      await deleteGeneratedImage(thumbnail.imageId);
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { status: 'failed', webImageUrl: undefined, imageUrl: undefined });
      // If this was favourited, decrement the favourites count
      if (localFavourite || thumbnail.favourite) {
        try {
          const key = ['favouriteCount', user?.id];
          queryClient.setQueryData<number>(key, (prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1));
        } catch {}
        queryClient.invalidateQueries({ queryKey: ['favouriteCount'] });
      }
    } catch {
      // no-op
    } finally {
      setTimeout(() => setIsDeleting(false), 600);
    }
  }, [thumbnail.imageId, thumbnail.jobId, thumbnail.index, queue]);

  const handleToggleExplore = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thumbnail.imageId || !isAdmin) return;
    if (isSavingToExplore) return;
    
    setIsSavingToExplore(true);
    try {
      if (isInExplore) {
        // Remove from explore - need to get the explore image ID first
        const checkResponse = await fetch(getApiUrl(`/api/admin/explore/check?generatedImageId=${thumbnail.imageId}`));
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.exploreImageId) {
            const response = await fetch(getApiUrl(`/api/admin/explore/remove?id=${checkData.exploreImageId}`), {
              method: 'DELETE',
            });
            
            if (response.ok) {
              setIsInExplore(false);
              toast({
                title: t('thumbnail.explore.removed', { ns: 'inference' }),
                variant: 'success',
              });
            } else {
              throw new Error('Failed to remove from explore');
            }
          }
        }
      } else {
        // Save to explore
        const response = await fetch(getApiUrl('/api/admin/explore/save'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generatedImageId: thumbnail.imageId }),
        });
        
        if (response.ok) {
          setIsInExplore(true);
          toast({
            title: t('thumbnail.explore.saved', { ns: 'inference' }),
            variant: 'success',
          });
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save to explore');
        }
      }
    } catch (error) {
      toast({
        title: t('thumbnail.explore.error', { ns: 'inference' }),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSavingToExplore(false), 600);
    }
  }, [thumbnail.imageId, isAdmin, isInExplore, isSavingToExplore, toast, t]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const imageUrl = thumbnail.imageUrl || thumbnail.webImageUrl;
    if (!imageUrl) return;
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      // Get job metadata from queue context
      const job = queue?.jobs.find(j => j.id === thumbnail.jobId);
      const jobMetadata = {
        styleId: job?.styleId,
        sceneId: job?.sceneId,
        wardrobeId: job?.wardrobeId,
        colorId: job?.colorId,
        quality: job?.quality,
        aspectRatio: job?.aspectRatio,
      };
      
      const { shareImage } = await import('@/lib/utils/share');
      const result = await shareImage({
        imageUrl,
        jobMetadata,
        t: (key: string, options?: { url?: string }) => t(key, { ...options, ns: 'inference' }),
      });
      
      if (result.success && result.method === 'clipboard') {
        toast({
          title: t('thumbnail.share.copiedToClipboard', { ns: 'inference' }),
          variant: 'success',
        });
      } else if (result.success) {
        toast({
          title: t('thumbnail.share.success', { ns: 'inference' }),
          variant: 'success',
        });
      }
      // Don't show error if user cancelled
    } catch (error) {
      toast({
        title: t('thumbnail.share.error', { ns: 'inference' }),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => setIsSharing(false), 600);
    }
  }, [thumbnail.imageUrl, thumbnail.webImageUrl, thumbnail.jobId, queue, isSharing, toast, t]);

  return (
    <div 
      className={`${styles.thumbnail} ${getStatusClass()} ${!hasAnyImage ? styles.empty : ''}`}
      onClick={onClick}
      style={{ ['--stagger' as any]: thumbnail.index }}
    >
      {/* Image or placeholder */}
      <div className={styles.imageContainer + ' ' + (variant === 'hero' ? styles.hero : '')}>
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
                alt={t('thumbnail.alt.generatingPreview', { index: thumbnail.index + 1 })}
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
                    alt={t('thumbnail.alt.generated', { index: thumbnail.index + 1 })}
                    fill
                    className={`${styles.imageLayer} ${(finalLoaded || showDualLayer || shouldZoomOnMount) ? styles.visible : ''} ${shouldZoomOnMount ? styles.zoomOnMount : ''}`}
                    style={{ objectFit: objectFit as any }}
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
              const src1024 = base; // base URL is 1024w variant
              const srcSet = variant === 'hero'
                ? `${src480} 480w, ${src720} 720w, ${src1024} 1024w`
                : `${src480} 480w, ${src720} 720w`;
              const sizes = variant === 'hero'
                ? '(max-width: 768px) 100vw, 100vw'
                : '(max-width: 640px) 360px, 240px';
              return (
                <img
                  src={variant === 'hero' ? src1024 : src480}
                  srcSet={srcSet}
                  sizes={sizes}
                  alt={t('thumbnail.alt.generated', { index: thumbnail.index + 1 })}
                  className={`${styles.imageLayer} ${(finalLoaded || showDualLayer || shouldZoomOnMount) ? styles.visible : ''} ${shouldZoomOnMount ? styles.zoomOnMount : ''}`}
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

        {/* Quote overlay (only on last thumbnail during generation) */}
        {shouldShowQuoteOverlay && (
          <div className={styles.quoteOverlay}>
            <svg className={styles.quoteOverlayIcon + ' ' + styles.quoteOverlayIconTopLeft} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28.3965 1.7002H16.3984C8.39031 1.7002 1.89844 8.19207 1.89844 16.2002V28.2002H0.398438V16.2002C0.398438 7.36364 7.56188 0.200196 16.3984 0.200195H28.3965V1.7002Z" fill="#99EFEC"/>
            </svg>
            <svg className={styles.quoteOverlayIcon + ' ' + styles.quoteOverlayIconTopRight} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.400391 1.7002H12.3984C20.4066 1.7002 26.8984 8.19207 26.8984 16.2002V28.2002H28.3984V16.2002C28.3984 7.36364 21.235 0.200196 12.3984 0.200195H0.400391V1.7002Z" fill="#99EFEC"/>
            </svg>
            <svg className={styles.quoteOverlayIcon + ' ' + styles.quoteOverlayIconBottomRight} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.400391 26.7002H12.3984C20.4066 26.7002 26.8984 20.2083 26.8984 12.2002V0.200195H28.3984V12.2002C28.3984 21.0368 21.235 28.2002 12.3984 28.2002H0.400391V26.7002Z" fill="#99EFEC"/>
            </svg>
            <svg className={styles.quoteOverlayIcon + ' ' + styles.quoteOverlayIconBottomLeft} width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28.3965 26.7002H16.3984C8.39031 26.7002 1.89844 20.2083 1.89844 12.2002V0.200195H0.398438V12.2002C0.398438 21.0368 7.56188 28.2002 16.3984 28.2002H28.3965V26.7002Z" fill="#99EFEC"/>
            </svg>

            <div className={`${styles.quoteContent} ${quoteVisible ? styles.quoteVisible : styles.quoteHidden}`}>
              {quotes[currentQuoteIndex]}
            </div>
          </div>
        )}

        {/* Hover actions */}
        {thumbnail.status === 'completed' && (thumbnail.webImageUrl || thumbnail.imageUrl) && finalLoaded && (
          <div className={styles.actionsOverlay}>
            <div className={styles.actionBtnGroup}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      className={`${styles.actionBtn} ${localFavourite ? styles.favBtn : ''}`}
                      onClick={handleToggleFavourite}
                      aria-label={localFavourite ? t('thumbnail.favourite.remove') : t('thumbnail.favourite.add')}
                      disabled={isTogglingFav}
                    >
                      {isTogglingFav
                        ? <Loader size="sm" />
                        : <Icon variant={localFavourite ? 'heart' : 'heartOutline'} size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{localFavourite ? t('thumbnail.favourite.remove') : t('thumbnail.favourite.add')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      className={styles.actionBtn}
                      onClick={handleShare}
                      aria-label={t('thumbnail.actions.share.aria')}
                      disabled={isSharing}
                    >
                      {isSharing ? <Loader size="sm" /> : <Icon variant="share" size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('thumbnail.actions.share.label')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Star icon for admins */}
              {isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        className={`${styles.actionBtn} ${isInExplore ? styles.exploreBtn : ''}`}
                        onClick={handleToggleExplore}
                        aria-label={isInExplore ? t('thumbnail.explore.remove') : t('thumbnail.explore.add')}
                        disabled={isSavingToExplore}
                      >
                        {isSavingToExplore
                          ? <Loader size="sm" />
                          : <Icon variant={isInExplore ? 'star' : 'starOutline'} size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{isInExplore ? t('thumbnail.explore.remove') : t('thumbnail.explore.add')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <TooltipProvider>
              {/* Favourite is handled by the pinned button; no duplicate here */}
              <div className={styles.actionBtnGroup}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={handleDelete} aria-label={t('thumbnail.actions.delete.aria')} disabled={isDeleting}>
                      {isDeleting ? <Loader size="sm" /> : <Icon variant="bin" size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('thumbnail.actions.delete.label')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={handleDownload} aria-label={t('thumbnail.actions.download.aria')} disabled={isDownloading || (!thumbnail.imageUrl && !thumbnail.webImageUrl)}>
                      {isDownloading ? <Loader size="sm" /> : <Icon variant="download" size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{t('thumbnail.actions.download.label')}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

