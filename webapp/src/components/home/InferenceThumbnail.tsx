'use client';

import { FC, useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './InferenceThumbnail.module.css';
import { getInferenceImageThumbnail, getInferenceImageCard } from '@/lib/utils/get-inference-image';
import { Icon } from '@primeshot/common/web/Icon';
import { Button } from '@primeshot/common/web/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { Loader } from '@primeshot/common/web/ui/loader';
import { useOptionalInferenceQueue } from '@/contexts/inference-queue-context';

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
}

export const InferenceThumbnailComponent: FC<InferenceThumbnailProps> = ({
  thumbnail,
  jobStatus,
  onClick,
  variant = 'grid'
}) => {
  // Track layered transition state between preview and final image
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(thumbnail.webImageUrl || thumbnail.imageUrl);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [finalLoaded, setFinalLoaded] = useState(false);
  const [startZoom, setStartZoom] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasMountedRef = useRef(false);
  const zoomTriggeredRef = useRef(false);
  
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

  // Inline action state
  const queue = useOptionalInferenceQueue();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleFavourite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!thumbnail.imageId) return;
    if (isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { favourite: !thumbnail.favourite });
      const { setImageFavourite } = await import('@/lib/api/inference-images');
      await setImageFavourite(thumbnail.imageId, !thumbnail.favourite);
    } catch {
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { favourite: thumbnail.favourite });
    } finally {
      setIsTogglingFav(false);
    }
  }, [thumbnail.imageId, thumbnail.favourite, thumbnail.jobId, thumbnail.index, queue, isTogglingFav]);

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
    if (!thumbnail.imageId) return;
    setIsDeleting(true);
    try {
      const { deleteGeneratedImage } = await import('@/lib/api/inference-images');
      await deleteGeneratedImage(thumbnail.imageId);
      queue?.updateThumbnail(thumbnail.jobId, thumbnail.index, { status: 'failed', webImageUrl: undefined, imageUrl: undefined });
    } catch {
      // no-op
    } finally {
      setTimeout(() => setIsDeleting(false), 600);
    }
  }, [thumbnail.imageId, thumbnail.jobId, thumbnail.index, queue]);

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
                    className={`${styles.imageLayer} ${(finalLoaded || showDualLayer || shouldZoomOnMount) ? styles.visible : ''} ${shouldZoomOnMount ? styles.zoomOnMount : ''}`}
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
                  alt={`Generated image ${thumbnail.index + 1}`}
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

        {/* Pinned favourite (when true) */}
        {thumbnail.status === 'completed' && (thumbnail.webImageUrl || thumbnail.imageUrl) && thumbnail.favourite && (
          <div className={styles.favPinned}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={`${styles.actionBtn} ${styles.favBtn} ${styles.alwaysVisible}`} onClick={handleToggleFavourite} aria-label="Remove from favourites" disabled={isTogglingFav}>
                    {isTogglingFav ? <Loader size="sm" /> : <Icon variant="heart" size={16} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Remove from Favourites</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Hover actions */}
        {thumbnail.status === 'completed' && (thumbnail.webImageUrl || thumbnail.imageUrl) && (
          <div className={styles.actionsOverlay}>
            <TooltipProvider>
              {/* Favourite (only show here if not already favourite) */}
              {!thumbnail.favourite && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" iconOnly className={`${styles.actionBtn} ${styles.favBtn}`} onClick={handleToggleFavourite} aria-label="Add to favourites" disabled={isTogglingFav}>
                      {isTogglingFav ? <Loader size="sm" /> : <Icon variant="heartOutline" size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Add to Favourites</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={handleDelete} aria-label="Delete image" disabled={isDeleting || !thumbnail.imageId}>
                    {isDeleting ? <Loader size="sm" /> : <Icon variant="bin" size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" iconOnly className={styles.actionBtn} onClick={handleDownload} aria-label="Download image" disabled={isDownloading || (!thumbnail.imageUrl && !thumbnail.webImageUrl)}>
                    {isDownloading ? <Loader size="sm" /> : <Icon variant="download" size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Download</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

