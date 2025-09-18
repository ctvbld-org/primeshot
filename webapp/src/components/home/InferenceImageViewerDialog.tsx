'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Icon } from '@primeshot/common/web/Icon';
import { Button } from '@primeshot/common/web/ui/button';
import { Dialog as PSDialog, DialogContent as PSDialogContent } from '@primeshot/common/web/ui/dialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import confirmStyles from '@/lib/services/confirmation.module.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@primeshot/common/web/ui/tooltip';
import { useToast } from '@primeshot/common/web/ui/use-toast';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { getInferenceImageOriginal, getInferenceImageThumbnail, getInferenceImageCard, getInferenceImageUrl } from '@/lib/utils/get-inference-image';
import styles from './InferenceImageViewerDialog.module.css';
import { useStyle, useScene, useWardrobe, useColor, useSceneById, useWardrobeById, useColorById } from '@/hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { useGenerationConfig } from '@/hooks/useGenerationConfig';
import { getApiUrl } from '@/lib/api/client';
import { useOptionalInferenceQueue } from '@/contexts/inference-queue-context';
import { Loader } from '@primeshot/common/web/ui/loader';

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
  shootNumber: number;
}

export const InferenceImageViewerDialog: FC<InferenceImageViewerDialogProps> = ({
  job,
  initialImageIndex,
  shootNumber,
}) => {
  const { closeDialog } = useDialogService();
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);
  const { t } = useTranslation(['styles']);
  const queue = useOptionalInferenceQueue();
  const { toast } = useToast();
  const [favAnimatingKey, setFavAnimatingKey] = useState<number>(0);
  const [isTogglingFav, setIsTogglingFav] = useState(false);
  const [showFavConfirm, setShowFavConfirm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stripRef = React.useRef<HTMLDivElement | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: Math.max(0, Math.min(initialImageIndex, (job?.thumbnails?.length || 1) - 1)),
    align: 'center',
    containScroll: false,
    duration: 30,
    loop: false,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Use live-updating job from queue context if available
  const activeJob = useMemo(() => {
    const jobs = queue?.jobs;
    return jobs?.find(j => j.id === job.id) || job;
  }, [queue?.jobs, job]);

  // Filter out deleted/failed thumbnails that have no image URLs
  const visibleThumbnails = useMemo(() => {
    return activeJob.thumbnails.filter(thumb => {
      // Keep thumbnails that have images or are still generating
      return thumb.webImageUrl || thumb.imageUrl || 
             (thumb.status === 'running' || thumb.status === 'queued');
    });
  }, [activeJob.thumbnails]);

  // Ensure currentImageIndex is valid for the filtered array
  useEffect(() => {
    if (visibleThumbnails.length > 0 && currentImageIndex >= visibleThumbnails.length) {
      setCurrentImageIndex(Math.max(0, visibleThumbnails.length - 1));
    }
  }, [visibleThumbnails.length, currentImageIndex]);

  const currentThumbnail = visibleThumbnails[currentImageIndex];
  const completedThumbnails = visibleThumbnails.filter(thumb => thumb.status === 'completed');

  const isFavourite = Boolean(currentThumbnail?.favourite);

  const toggleFavourite = useCallback(async () => {
    if (!currentThumbnail?.imageId) return;
    if (isTogglingFav) return;
    setIsTogglingFav(true);
    // optimistic update
    try {
      queue?.updateThumbnail(activeJob.id, currentImageIndex, { favourite: !isFavourite });
      const { setImageFavourite } = await import('@/lib/api/inference-images');
      await setImageFavourite(currentThumbnail.imageId, !isFavourite, { retries: 2 });
      // retrigger animation when setting to true
      if (!isFavourite) {
        setFavAnimatingKey(k => k + 1);
        setShowFavConfirm(true);
        setTimeout(() => setShowFavConfirm(false), 700);
      }
    } catch (e: any) {
      // revert
      queue?.updateThumbnail(activeJob.id, currentImageIndex, { favourite: isFavourite });
      toast({ title: 'Failed to update favourite', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsTogglingFav(false);
    }
  }, [currentThumbnail?.imageId, isFavourite, queue, activeJob.id, currentImageIndex, toast, isTogglingFav]);

  // Helper to detect UUID vs value codes (copied from group component)
  const isUuid = (v?: string) => !!v && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(v);
  const useSceneHook = isUuid(activeJob.sceneId) ? useSceneById : useScene;
  const useWardrobeHook = isUuid(activeJob.wardrobeId) ? useWardrobeById : useWardrobe;
  const useColorHook = isUuid(activeJob.colorId) ? useColorById : useColor;

  const { data: styleData } = useStyle(activeJob.styleId as any);
  const { data: sceneData } = useSceneHook((activeJob.sceneId || undefined) as any);
  const { data: wardrobeData } = useWardrobeHook((activeJob.wardrobeId || undefined) as any);
  const { data: colorData } = useColorHook((activeJob.colorId || undefined) as any);

  const subtitle = useMemo(() => {
    const style = styleData?.name || '';
    const scene = (sceneData as any)?.label || '';
    const wardrobe = (wardrobeData as any)?.label || '';
    const color = (colorData as any)?.label || '';
    if (!style || !scene || !wardrobe || !color) return '';
    return t('shoot.subtitle', { ns: 'styles', style, scene, wardrobe, color });
  }, [styleData?.name, (sceneData as any)?.label, (wardrobeData as any)?.label, (colorData as any)?.label, t]);

  // Resolve character avatar URL if present
  useEffect(() => {
    const run = async () => {
      const raw = activeJob.characterThumbnailUrl;
      if (!raw) { setCharacterImageUrl(null); return; }
      try {
        const res = await fetch(getApiUrl(`/api/user-images?url=${encodeURIComponent(raw)}`));
        if (!res.ok) { setCharacterImageUrl(null); return; }
        const json = await res.json();
        setCharacterImageUrl(json.url || null);
      } catch {
        setCharacterImageUrl(null);
      }
    };
    run();
  }, [activeJob.characterThumbnailUrl]);

  // Reset loading state when image index changes
  useEffect(() => {
    setImageLoading(true);
  }, [currentImageIndex]);

  // Reset original display when switching images/jobs
  useEffect(() => {
    setShowOriginal(false);
    setOverlayActive(false);
    setOverlaySrc(null);
  }, [currentImageIndex, activeJob.id]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        emblaApi?.scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        emblaApi?.scrollNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDialog, visibleThumbnails.length, emblaApi]);

  // Prefetch neighbor images (±2) for snappier navigation
  useEffect(() => {
    const neighborOffsets = [-2, -1, 1, 2];
    const total = visibleThumbnails.length;
    for (const offset of neighborOffsets) {
      const idx = (currentImageIndex + offset + total) % total;
      const neighbor = visibleThumbnails[idx];
      if (!neighbor || neighbor.status !== 'completed') continue;
      const base = neighbor.webImageUrl || neighbor.imageUrl || '';
      if (!base) continue;
      preloadImage(base);
      // Also warm 480/720 used by thumbnails
      preloadImage(getInferenceImageThumbnail(base));
      preloadImage(getInferenceImageCard(base));
    }
  }, [currentImageIndex, visibleThumbnails, currentThumbnail]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    console.error('Failed to load image:', currentThumbnail?.imageUrl || currentThumbnail?.webImageUrl);
  }, [currentThumbnail]);

  // Action handlers
  const handleDownload = useCallback(async () => {
    if (!currentThumbnail?.imageUrl && !currentThumbnail?.webImageUrl) return;
    setIsDownloading(true);

    try {
      // Use imageUrl (original) for download, fallback to webImageUrl
      const imageUrl = currentThumbnail.imageUrl || currentThumbnail.webImageUrl!;
      const filename = `primeshot-shoot-${shootNumber.toString().padStart(3, '0')}-img-${(currentThumbnail.index + 1).toString().padStart(2, '0')}.png`;
      
      // Fetch the image as blob to ensure filename is respected
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link if blob download fails
      try {
        const imageUrl = currentThumbnail.imageUrl || currentThumbnail.webImageUrl!;
        const filename = `primeshot-shoot-${shootNumber.toString().padStart(3, '0')}-img-${(currentThumbnail.index + 1).toString().padStart(2, '0')}.png`;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  }, [currentThumbnail, shootNumber]);

  const performDelete = useCallback(async () => {
    if (!currentThumbnail?.imageId) return;
    // Disable UI and pulse main image
    setIsDownloading(true);
    setIsDeleting(true);
    setOverlayActive(true);

    try {
      const { deleteGeneratedImage } = await import('@/lib/api/inference-images');
      const result = await deleteGeneratedImage(currentThumbnail.imageId);
      
      // Find the original index in the full thumbnails array
      const originalIndex = activeJob.thumbnails.findIndex(thumb => thumb.id === currentThumbnail.id);
      if (originalIndex !== -1) {
        // Remove the image from current job thumbnails list
        queue?.updateThumbnail(activeJob.id, originalIndex, { status: 'failed', webImageUrl: undefined, imageUrl: undefined });
        // Also update the activeJob reference locally
        try {
          (activeJob as any).thumbnails[originalIndex] = {
            ...(activeJob as any).thumbnails[originalIndex],
            webImageUrl: undefined,
            imageUrl: undefined,
            status: 'failed'
          };
        } catch {}
      }
      
      // After deletion, adjust current index for the filtered visible thumbnails
      // The visibleThumbnails will be recalculated and this item will be filtered out
      setTimeout(() => {
        // Use setTimeout to let the visibleThumbnails recalculate first
        setCurrentImageIndex(prevIndex => {
          // If we're at the last visible item and it gets deleted, go to previous
          if (prevIndex >= visibleThumbnails.length - 1) {
            return Math.max(0, visibleThumbnails.length - 2);
          }
          // Otherwise stay at the same index (which will now show the next image)
          return prevIndex;
        });
      }, 0);
      
      if (!result.remaining) {
        queue?.updateJobStatus(activeJob.id, 'deleted' as any);
      }
    } catch (e) {
      console.error('Failed to delete image', e);
    } finally {
      setTimeout(() => {
        // isDelete flag semantics reserved for future disabling logic of other buttons
        setIsDeleting(false);
        setIsDownloading(false);
        setOverlayActive(false);
      }, 600);
    }
  }, [currentThumbnail?.imageId, currentThumbnail?.id, queue, activeJob.id, activeJob.thumbnails, visibleThumbnails.length]);

  const handleDelete = useCallback(() => {
    if (!currentThumbnail?.imageId) return;
    setConfirmOpen(true);
  }, [currentThumbnail?.imageId]);

  const handleRegenerate = useCallback(() => {
    // TODO: Implement regenerate functionality
    console.log('Regenerate image:', currentThumbnail?.id);
  }, [currentThumbnail]);

  const handleThumbnailClick = useCallback((index: number) => {
    if (index !== currentImageIndex) {
      emblaApi?.scrollTo(index);
    }
  }, [currentImageIndex, emblaApi]);

  // Format aspect ratio with orientation
  const aspectRatioText = useMemo(() => {
    const v = activeJob.aspectRatio || '';
    if (!v) return '';
    let w = 0, h = 0;
    if (v.includes(':')) {
      const [a, b] = v.split(':');
      w = parseFloat(a); h = parseFloat(b);
    } else if (/_/.test(v)) {
      // e.g., portrait_4_5
      const m = v.match(/(\d+)[^\d]+(\d+)/);
      if (m) { w = parseFloat(m[1]); h = parseFloat(m[2]); }
    }
    const base = (w && h) ? `${w}:${h}` : v;
    let orient = '';
    if (w && h) orient = w === h ? 'Square' : (w > h ? 'Landscape' : 'Portrait');
    return orient ? `${base} (${orient})` : base;
  }, [activeJob.aspectRatio]);

  const { data: gen } = useGenerationConfig();
  const qualityText = useMemo(() => {
    const code = String(activeJob.quality || '');
    const map = gen?.inferenceSettings?.quality_labels || {};
    const raw = map[code] || (code ? code.toUpperCase() : '');
    // Map DB label to i18n key: Basic/Medium/High → basic/medium/high
    const i18nKey = String(raw).toLowerCase().replace(/[^a-z]/g, '');
    return t(`qualities.${i18nKey}` as any, { ns: 'styles', defaultValue: raw });
  }, [activeJob.quality, gen?.inferenceSettings?.quality_labels, t]);

  // Time ago helper
  const timeAgoText = useMemo(() => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - activeJob.createdAt.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }, [activeJob.createdAt]);

  // Prefer web variant for faster display; allow toggling to original
  const baseImageUrl = currentThumbnail?.webImageUrl || currentThumbnail?.imageUrl || '';
  const resolveOriginalFromBase = useCallback((base: string): string => {
    if (!base) return '';
    if (currentThumbnail?.imageUrl) return currentThumbnail.imageUrl;
    try {
      // If it's proxied, rebuild through helper to ensure correct encoding
      if (base.includes('/api/app-images?path=')) {
        const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const pathParam = u.searchParams.get('path') || '';
        const decoded = decodeURIComponent(pathParam);
        const swapped = decoded.replace('/web/', '/orig/').replace(/\.webp$/i, '.png');
        return getInferenceImageUrl(swapped, false);
      }
    } catch {}
    return getInferenceImageOriginal(base);
  }, [currentThumbnail?.imageUrl]);

  // Try multiple candidate original URLs in case of format/path variations
  const buildOriginalCandidates = useCallback((base: string): string[] => {
    const candidates: string[] = [];
    const primary = resolveOriginalFromBase(base);
    if (primary) candidates.push(primary);
    try {
      if (primary.includes('/api/app-images?path=')) {
        const u = new URL(primary, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        const pathParam = u.searchParams.get('path') || '';
        const decoded = decodeURIComponent(pathParam);
        // alt extensions
        const jpg = decoded.replace(/\.(png|webp)$/i, '.jpg');
        const jpeg = decoded.replace(/\.(png|webp)$/i, '.jpeg');
        const altDir = decoded.replace('/orig/', '/original/');
        if (jpg !== decoded) candidates.push(getInferenceImageUrl(jpg, false));
        if (jpeg !== decoded) candidates.push(getInferenceImageUrl(jpeg, false));
        if (altDir !== decoded) candidates.push(getInferenceImageUrl(altDir, false));
      }
    } catch {}
    return Array.from(new Set(candidates));
  }, [resolveOriginalFromBase]);

  // (Deprecated) swapped-image flow removed in favor of overlay-only

  // Unified handler: preload original and show in overlay without touching base img
  const loadAndShowOriginal = useCallback(async () => {
    const base = currentThumbnail?.webImageUrl || currentThumbnail?.imageUrl || '';
    const candidates = buildOriginalCandidates(base);
    let loadedUrl: string | null = null;
    for (const url of candidates) {
      const ok = await new Promise<boolean>((resolve) => {
        try {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        } catch { resolve(false); }
      });
      if (ok) { loadedUrl = url; break; }
    }
    if (!loadedUrl) {
      toast({ title: 'Original unavailable', description: 'Could not load original image variant.', variant: 'destructive' });
      return false;
    }
    // Only populate the overlay image; do NOT change the base image tag
    setOverlaySrc(loadedUrl);
    setOverlayActive(true);
    setShowOriginal(true); // hide the button after activation
    return true;
  }, [buildOriginalCandidates, currentThumbnail?.webImageUrl, currentThumbnail?.imageUrl, toast]);

  const mainImageUrl = showOriginal ? resolveOriginalFromBase(baseImageUrl) : baseImageUrl;

  // Direct DOM ref to swap src after preload for seamless transition
  const mainImgRef = React.useRef<HTMLImageElement | null>(null);
  const thumbArClass = useMemo(() => {
    const v = (activeJob.aspectRatio || '').toLowerCase();
    if (v.includes('1:1') || v.includes('square')) return styles.thumbAR11;
    if (v.includes('3:2') || /3\s*[:_\/]\s*2/.test(v) || /5\s*[:_\/]\s*4/.test(v) || v.includes('landscape')) return styles.thumbAR32;
    // default to portrait-like 2:3 / 4:5
    return styles.thumbAR23;
  }, [activeJob.aspectRatio]);
  const imageArClass = useMemo(() => {
    const v = (activeJob.aspectRatio || '').toLowerCase();
    if (v.includes('1:1') || v.includes('square')) return styles.mainAR11;
    if (v.includes('3:2') || /3\s*[:_\/]\s*2/.test(v) || /5\s*[:_\/]\s*4/.test(v) || v.includes('landscape')) return styles.mainAR32;
    return styles.mainAR23;
  }, [activeJob.aspectRatio]);
  const isGenerating = useMemo(() => {
    const s = (activeJob.status || '').toLowerCase();
    return s === 'running' || s === 'pending' || s === 'initializing' || currentThumbnail?.status === 'running' || currentThumbnail?.status === 'queued';
  }, [activeJob.status, currentThumbnail?.status]);

  // Embla selection sync
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const newIndex = emblaApi.selectedScrollSnap();
      setCurrentImageIndex(newIndex);
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    const onResize = () => {
      // Force Embla to recalc sizes when container/image dimensions change
      requestAnimationFrame(() => {
        emblaApi.reInit();
        onSelect();
      });
    };
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    // Ensure correct starting slide
    try { emblaApi.scrollTo(Math.min(currentImageIndex, Math.max(0, visibleThumbnails.length - 1)), true); } catch {}
    onSelect();
    window.addEventListener('resize', onResize);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      window.removeEventListener('resize', onResize);
    };
  }, [emblaApi, visibleThumbnails.length]); // Remove currentImageIndex dependency

  // Re-init when the number of slides or aspect ratio class changes
  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, visibleThumbnails.length, imageArClass]);

  // Carousel navigation
  const goPrev = useCallback(() => {
    setCurrentImageIndex((prev) => {
      const total = visibleThumbnails.length;
      if (total <= 1) return prev;
      return prev > 0 ? prev - 1 : total - 1;
    });
  }, [visibleThumbnails.length]);

  const goNext = useCallback(() => {
    setCurrentImageIndex((prev) => {
      const total = visibleThumbnails.length;
      if (total <= 1) return prev;
      return prev < total - 1 ? prev + 1 : 0;
    });
  }, [visibleThumbnails.length]);

  // Keep active thumbnail visible when navigating
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const child = el.children.item(currentImageIndex) as HTMLElement | null;
    if (!child) return;
    try {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } catch {
      // no-op
    }
  }, [currentImageIndex]);
  
  if (!currentThumbnail) {
    return null;
  }

  return (
    <div className={styles.viewer}>
      {/* Inline confirm dialog layered over the viewer */}
      {confirmOpen && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete image?"
          description="This will permanently delete the image and can’t be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => { setConfirmOpen(false); performDelete(); }}
          onCancel={() => setConfirmOpen(false)}
          iconVariant="bin"
          confirmVariant="destructive"
        />
      )}
      {/* Close button */}
      <Button 
        variant="ghost"
        className={styles.closeButton}
        onClick={closeDialog}
        aria-label="Close viewer"
      >
        <Icon variant="cross" size={32} />
      </Button>

      {/* Main image area */
      }
      <div className={styles.imageArea}>
        <div className={`${styles.imageContainer} ${isGenerating ? styles.imageContainerGenerating : ''}`}>
          <div className={styles.emblaViewport} ref={emblaRef}>
            <div className={styles.emblaContainer}>
              {visibleThumbnails.map((thumb, idx) => {
                const base = thumb.webImageUrl || thumb.imageUrl || '';
                const isActive = idx === currentImageIndex;
                const src = isActive ? mainImageUrl : base;
                return (
                  <div className={styles.emblaSlide} key={thumb.id} aria-hidden={!isActive}>
                    {src && (
                      <img
                        src={src}
                        alt={`Generated image ${idx + 1}`}
                        className={`${styles.mainImage} ${imageArClass}`}
                        ref={isActive ? mainImgRef : undefined}
                        onLoad={isActive ? handleImageLoad : undefined}
                        onError={isActive ? handleImageError : undefined}
                        loading={isActive ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Carousel navigation buttons */}
          <div className={styles.carouselButtons} aria-label="Carousel navigation">
            <button
              className={styles.navButton}
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev || visibleThumbnails.length <= 1}
              aria-label="Previous image"
            >
              <Icon variant="arrowLeft" size={20} />
            </button>
            <button
              className={styles.navButton}
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext || visibleThumbnails.length <= 1}
              aria-label="Next image"
            >
              <Icon variant="arrowRight" size={20} />
            </button>
          </div>
          { overlaySrc && (
            <>
              <img
                data-overlay="true"
                src={overlaySrc || ''}
                alt=""
                aria-hidden="true"
                className={`${styles.mainImage} ${styles.overlayImage} ${imageArClass}`}
                decoding="async"
                style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', display: overlayActive ? 'block' : 'none' }}
              />
              <Button
                variant="ghost"
                className={`${styles.downloadOriginalButton} ${styles.iconButton}`}
                onClick={loadAndShowOriginal}
                aria-label="Display original image"
              >
                <Icon variant="download" size={18} />
                Display original
              </Button>
            </>
          )}
          
          {/* Deletion loading overlay */}
          {isDeleting && (
            <div className={styles.deletionOverlay}>
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        {/* Image metadata */}
        <div className={styles.metadata}>
          <div className={styles.metadataHeader}>
            <h3 className={styles.title}>
              Shoot {shootNumber} <span className={styles.imageIndex}>IMG {currentImageIndex + 1}</span>
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`${styles.iconButton} ${styles.favButton} ${isFavourite ? styles.favActive : ''} ${isTogglingFav ? styles.favBeating : ''}`}
                    aria-label="Favorite"
                    aria-pressed={isFavourite}
                    onClick={toggleFavourite}
                    disabled={isTogglingFav || !currentThumbnail?.imageId}
                    data-anim-key={favAnimatingKey}
                  >
                    <span className={`${styles.favIconWrapper} ${isFavourite ? styles.favIconActive : ''}`}>
                      <Icon variant={isFavourite ? 'heart' : 'heartOutline'} size={16} />
                    </span>
                    {showFavConfirm && (
                      <span className={styles.favConfirm} aria-hidden="true">
                        <Icon className={styles.favConfirmIcon} variant="heart" size={18} />
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {!!subtitle && (
            <>
              <div className={styles.subtitle}>{subtitle}</div>
              <hr className={styles.metadataSeparator} />
            </>
          )}
          
          <div className={styles.metadataSection}>
            <div className={styles.metadataGrid}>
              {[
                { label: 'Aspect Ratio', value: aspectRatioText },
                { label: 'Quality', value: qualityText },
                { label: 'Model', value: 'Primeshot v1' },
              ].map((item) => (
                <div className={styles.metadataItem} key={item.label}>
                  <p className={styles.metadataLabel}>{item.label}</p>
                  <p className={styles.metadataValue}>{item.value}</p>
                </div>
              ))}
            </div>

            <hr className={styles.metadataSeparator} />

            {/* Character block */}
            {(activeJob.characterName || characterImageUrl) && (
              <div className={styles.characterRow}>
                {characterImageUrl && (
                  <img src={characterImageUrl} alt={activeJob.characterName || 'Character'} className={styles.characterAvatar} />
                )}
                <div className={styles.characterName}>
                  <p className={styles.metadataLabel}>Character</p>
                  <p className={styles.metadataValue}>{activeJob.characterName || ''}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.metadataFooter}>
          <p className={styles.timeAgo}>{timeAgoText}</p>
          <div className={styles.actions}>
            <TooltipProvider>
              {[
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: 'bin' as const,
                  onClick: handleDelete,
                  aria: 'Delete image',
                  loading: isDeleting,
                },
                {
                  key: 'download',
                  label: 'Download',
                  icon: 'download' as const,
                  onClick: handleDownload,
                  aria: 'Download image',
                  disabled: !currentThumbnail.imageUrl && !currentThumbnail.webImageUrl,
                  loading: isDownloading,
                },
                // {
                //   key: 'share',
                //   label: 'Share',
                //   icon: 'restart' as const,
                //   onClick: handleRegenerate,
                //   aria: 'Share on social',
                // },
                // {
                //   key: 'regenerate',
                //   label: 'Rerun',
                //   icon: 'restart' as const,
                //   onClick: handleRegenerate,
                //   aria: 'Rerun the shoot',
                // },
              ].map((a) => (
                <Tooltip key={a.key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`${styles.actionButton} ${styles.iconButton}`}
                      onClick={a.onClick}
                      aria-label={a.aria}
                      disabled={a.disabled || a.loading}
                    >
                      {a.loading ? <Loader size="sm" /> : <Icon variant={a.icon} size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{a.label}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className={`${styles.thumbnailStrip} ${thumbArClass}`} ref={stripRef}>
        {visibleThumbnails.map((thumbnail, index) => {
          const hasImage = Boolean(thumbnail.webImageUrl || thumbnail.imageUrl);
          const generating = (thumbnail.status === 'running' || thumbnail.status === 'queued') && !hasImage;
          return (
          <div
            key={thumbnail.id}
            className={`${styles.thumbnailItem} ${thumbArClass} ${
              index === currentImageIndex ? styles.thumbnailActive : ''
            } ${thumbnail.status !== 'completed' ? styles.thumbnailDisabled : ''} ${
              generating ? styles.thumbnailGenerating : ''
            }`}
            style={{ ['--stagger' as any]: thumbnail.index }}
            onClick={() => handleThumbnailClick(index)}
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
        );})}
      </div>
    </div>
  );
};
