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
import { InferenceThumbnail } from '@/components/inference/InferenceThumbnail';
import { getInferenceImageOriginal, getInferenceImageThumbnail, getInferenceImageCard, getInferenceImageUrl } from '@/lib/utils/get-inference-image';
import styles from './InferenceImageViewerDialog.module.css';
import { useStyle, useScene, useWardrobe, useColor, useSceneById, useWardrobeById, useColorById } from '@/hooks/useConfig';
import { useTranslatedScene, useTranslatedWardrobe, useTranslatedColor } from '@/hooks/useTranslatedStyles';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from 'react-i18next';
import { useGenerationConfig } from '@/hooks/useGenerationConfig';
import { getApiUrl } from '@primeshot/common';
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
  hideHeader?: boolean;
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Store overlay per image ID to persist when navigating
  const [overlayCache, setOverlayCache] = useState<Record<string, { src: string, loaded: boolean }>>({});
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
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
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      // Update favourites count cache for immediate header reaction
      try {
        const key = ['favouriteCount', user?.id];
        queryClient.setQueryData<number>(key, (prev) => {
          const base = typeof prev === 'number' ? prev : 0;
          return Math.max(0, base + (!isFavourite ? 1 : -1));
        });
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['favouriteCount'] });
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

  const { data: styleData, isLoading: styleLoading } = useStyle(activeJob.styleId as any);
  const { data: sceneData, isLoading: sceneLoading } = useSceneHook((activeJob.sceneId || undefined) as any);
  const { data: wardrobeData, isLoading: wardrobeLoading } = useWardrobeHook((activeJob.wardrobeId || undefined) as any);
  const { data: colorData, isLoading: colorLoading } = useColorHook((activeJob.colorId || undefined) as any);

  // Get translated versions of the data
  const translatedScene = useTranslatedScene(sceneData);
  const translatedWardrobe = useTranslatedWardrobe(wardrobeData);
  const translatedColor = useTranslatedColor(colorData);

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

    const style = styleData?.name || '';
    const scene = (translatedScene?.label || '').toLowerCase();
    const wardrobe = (translatedWardrobe?.label || '').toLowerCase();
    const color = (translatedColor?.label || '').toLowerCase();
    
    // Debug logging to identify missing data
    if (!style || !scene || !wardrobe || !color) {
      console.log('InferenceImageViewerDialog - Missing subtitle data:', {
        activeJobIds: {
          styleId: activeJob.styleId,
          sceneId: activeJob.sceneId,
          wardrobeId: activeJob.wardrobeId,
          colorId: activeJob.colorId
        },
        loadedData: {
          style: style || 'MISSING',
          scene: scene || 'MISSING',
          wardrobe: wardrobe || 'MISSING',
          color: color || 'MISSING'
        },
        rawData: {
          styleData,
          sceneData,
          wardrobeData,
          colorData
        }
      });
    }
    
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

  // Reset overlay cache only when switching jobs (not when navigating within same job)
  useEffect(() => {
    setOverlayCache({});
    setIsLoadingOriginal(false);
  }, [activeJob.id]);

  // Carousel navigation (instant jump for clicks/keys; drag still slides)
  const goPrev = useCallback(() => {
    if (!emblaApi) return;
    const total = visibleThumbnails.length;
    if (total <= 1) return;
    const curr = emblaApi.selectedScrollSnap();
    const target = curr > 0 ? curr - 1 : total - 1;
    emblaApi.scrollTo(target, true);
  }, [emblaApi, visibleThumbnails.length]);

  const goNext = useCallback(() => {
    if (!emblaApi) return;
    const total = visibleThumbnails.length;
    if (total <= 1) return;
    const curr = emblaApi.selectedScrollSnap();
    const target = curr < total - 1 ? curr + 1 : 0;
    emblaApi.scrollTo(target, true);
  }, [emblaApi, visibleThumbnails.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeDialog, goPrev, goNext]);

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
      // If the deleted image was a favourite, refresh the favourites count
      if (currentThumbnail?.favourite) {
        try {
          const key = ['favouriteCount', user?.id];
          queryClient.setQueryData<number>(key, (prev) => Math.max(0, (typeof prev === 'number' ? prev : 0) - 1));
        } catch {}
        queryClient.invalidateQueries({ queryKey: ['favouriteCount'] });
      }
    } catch (e) {
      console.error('Failed to delete image', e);
    } finally {
      setTimeout(() => {
        // isDelete flag semantics reserved for future disabling logic of other buttons
        setIsDeleting(false);
        setIsDownloading(false);
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
      emblaApi?.scrollTo(index, true);
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
    if (diffInMinutes < 1) return t('inference:time.justNow');
    if (diffInMinutes < 60) return t('inference:time.minutesAgo', { count: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('inference:time.hoursAgo', { count: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    return t('inference:time.daysAgo', { count: diffInDays });
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
    if (!currentThumbnail?.id) return false;
    
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
      toast({ title: t('inference:viewer.overlay.originalUnavailableTitle'), description: t('inference:viewer.overlay.originalUnavailableDesc'), variant: 'destructive' });
      return false;
    }
    // Store in cache with loaded: false initially for fade-in effect
    setOverlayCache(prev => ({
      ...prev,
      [currentThumbnail.id]: { src: loadedUrl, loaded: false }
    }));
    return true;
  }, [buildOriginalCandidates, currentThumbnail?.webImageUrl, currentThumbnail?.imageUrl, currentThumbnail?.id, toast, t]);

  const handleViewOriginal = useCallback(async () => {
    if (!currentThumbnail?.id) return;
    // If 1K quality, already showing original
    if (activeJob.quality === '1K') return;
    // Check if already in cache
    if (overlayCache[currentThumbnail.id]) return;
    setIsLoadingOriginal(true);
    await loadAndShowOriginal();
    setIsLoadingOriginal(false);
  }, [loadAndShowOriginal, overlayCache, currentThumbnail?.id, activeJob.quality]);

  // Direct DOM ref to swap src after preload for seamless transition
  const mainImgRef = React.useRef<HTMLImageElement | null>(null);
  // Helpers to compute aspect-ratio classes per thumbnail (supports mixed favourites)
  const pickArVariant = useCallback((value?: string | null, url?: string | null) => {
    const v = String(value || '').toLowerCase();
    const byValue = (() => {
      if (!v) return '';
      if (v.includes('1:1') || v.includes('square')) return '11';
      // Parse patterns like 3:2, 5_4, landscape/portrait
      const m = v.match(/(\d+)\s*[:_\/]\s*(\d+)/);
      if (m) {
        const w = parseFloat(m[1]);
        const h = parseFloat(m[2]);
        if (w && h) {
          if (Math.abs(w - h) < 0.01) return '11';
          return w > h ? '32' : '23';
        }
      }
      if (v.includes('landscape')) return '32';
      if (v.includes('portrait')) return '23';
      return '';
    })();
    if (byValue) return byValue;
    const u = String(url || '').toLowerCase();
    if (!u) return '23';
    if (u.includes('square') || /(^|[_\-\/])1[_\-]?1(\.|[_\-\/])/.test(u)) return '11';
    if (u.includes('landscape') || /3[_\-]?2/.test(u) || /5[_\-]?4/.test(u)) return '32';
    if (u.includes('portrait') || /2[_\-]?3/.test(u) || /4[_\-]?5/.test(u)) return '23';
    // default to portrait-like
    return '23';
  }, []);

  const getThumbArClass = useCallback((thumb: InferenceThumbnail) => {
    const variant = pickArVariant((activeJob as any)?.aspectRatio, thumb.webImageUrl || thumb.imageUrl || '');
    if (variant === '11') return styles.thumbAR11;
    if (variant === '32') return styles.thumbAR32;
    return styles.thumbAR23;
  }, [pickArVariant, activeJob]);

  const imageArClass = useMemo(() => {
    const variant = pickArVariant((activeJob as any)?.aspectRatio, currentThumbnail?.webImageUrl || currentThumbnail?.imageUrl || '');
    if (variant === '11') return styles.mainAR11;
    if (variant === '32') return styles.mainAR32;
    return styles.mainAR23;
  }, [pickArVariant, activeJob, currentThumbnail?.webImageUrl, currentThumbnail?.imageUrl]);
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

  // (moved goPrev/goNext above keyboard navigation)

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
          title={t('inference:viewer.confirmDelete.title')}
          description={t('inference:viewer.confirmDelete.description')}
          confirmText={t('inference:viewer.confirmDelete.confirm')}
          cancelText={t('inference:viewer.confirmDelete.cancel')}
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
        aria-label={t('inference:viewer.closeAria')}
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
                const isActive = idx === currentImageIndex;
                const cachedOverlay = overlayCache[thumb.id];
                // If quality is 1K, always use original
                const is1K = activeJob.quality === '1K';
                const base = is1K ? (thumb.imageUrl || thumb.webImageUrl || '') : (thumb.webImageUrl || thumb.imageUrl || '');
                const isAlreadyOriginal = is1K;
                return (
                  <div className={styles.emblaSlide} key={thumb.id} aria-hidden={!isActive}>
                    {base && (
                      <img
                        src={base}
                        alt={t('inference:viewer.alt.generated', { index: idx + 1 })}
                        className={`${styles.mainImage} ${imageArClass}`}
                        ref={isActive ? mainImgRef : undefined}
                        onLoad={isActive ? handleImageLoad : undefined}
                        onError={isActive ? handleImageError : undefined}
                        loading={isActive ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    )}
                    {isActive && cachedOverlay && !isAlreadyOriginal && (
                      <img
                        data-overlay="true"
                        src={cachedOverlay.src}
                        alt={t('inference:viewer.alt.generated', { index: idx + 1 })}
                        aria-hidden="true"
                        className={`${styles.mainImage} ${styles.overlayImage} ${imageArClass}`}
                        decoding="async"
                        onLoad={() => {
                          setOverlayCache(prev => ({
                            ...prev,
                            [thumb.id]: { ...prev[thumb.id], loaded: true }
                          }));
                        }}
                        style={{ 
                          zIndex: 3, 
                          display: 'block',
                          opacity: cachedOverlay.loaded ? 1 : 0,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>          
          {/* Deletion loading overlay */}
          {isDeleting && (
            <div className={styles.deletionOverlay}>
            </div>
          )}
        </div>
        <div className={styles.imageControls}>
          {/* Carousel navigation buttons */}
          <div className={styles.carouselButtons} aria-label={t('inference:viewer.carousel.aria')}>
            <Button
              variant="secondary"
              size="md"
              iconOnly
              className={styles.navButton}
              onClick={goPrev}
              disabled={!canScrollPrev || visibleThumbnails.length <= 1}
              aria-label={t('inference:viewer.carousel.prevAria')}
            >
              <Icon variant="arrowLeft" size={20} />
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconOnly
              className={styles.navButton}
              onClick={goNext}
              disabled={!canScrollNext || visibleThumbnails.length <= 1}
              aria-label={t('inference:viewer.carousel.nextAria')}
            >
              <Icon variant="arrowRight" size={20} />
            </Button>
          </div>

          {currentThumbnail?.status === 'completed' && (currentThumbnail.webImageUrl || currentThumbnail.imageUrl) && (
            (() => {
              const is1K = activeJob.quality === '1K';
              const isViewingOriginal = is1K || !!(currentThumbnail && overlayCache[currentThumbnail.id]);
              return (
                <Button
                  variant="secondary"
                  size="md"
                  className={`${styles.viewOriginalButton} ${isViewingOriginal ? styles.viewOriginalActive : ''}`}
                  onClick={handleViewOriginal}
                  disabled={isLoadingOriginal || isViewingOriginal}
                  aria-label={
                    isViewingOriginal
                      ? t('inference:viewer.viewOriginal.viewingAria', { defaultValue: 'Currently viewing original quality image' })
                      : t('inference:viewer.viewOriginal.aria', { defaultValue: 'Load and display original quality image' })
                  }
                >
                  {isLoadingOriginal ? (
                    <Loader size="sm" />
                  ) : (
                    <>
                      <Icon variant={isViewingOriginal ? "check" : "camera"} size={16} />
                      <span className={styles.viewOriginalButtonText}>
                        {isViewingOriginal
                          ? t('inference:viewer.viewOriginal.viewing', { defaultValue: 'Viewing original' })
                          : t('inference:viewer.viewOriginal.label', { defaultValue: 'Toggle original' })
                        }
                      </span>
                    </>
                  )}
                </Button>
              );
            })()
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        {/* Image metadata */}
        <div className={styles.metadata}>
          <div className={styles.metadataHeader}>
            <h3 className={styles.title}>
              {t('inference:viewer.title', { shootNumber })} <span className={styles.imageIndex}>{t('inference:viewer.imageIndex', { index: currentImageIndex + 1 })}</span>
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`${styles.iconButton} ${styles.favButton} ${isFavourite ? styles.favActive : ''} ${isTogglingFav ? styles.favBeating : ''}`}
                    aria-label={t('inference:viewer.favourite.ariaButton')}
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
                <TooltipContent side="bottom">{isFavourite ? t('inference:viewer.favourite.remove') : t('inference:viewer.favourite.add')}</TooltipContent>
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
                { label: t('inference:viewer.metadata.labels.aspectRatio'), value: aspectRatioText },
                { label: t('inference:viewer.metadata.labels.quality'), value: qualityText },
                { label: t('inference:viewer.metadata.labels.model'), value: 'Primeshot v1' },
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
                  <p className={styles.metadataLabel}>{t('inference:viewer.metadata.labels.character')}</p>
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
                  label: t('inference:viewer.actions.delete.label'),
                  icon: 'bin' as const,
                  onClick: handleDelete,
                  aria: t('inference:viewer.actions.delete.aria'),
                  loading: isDeleting,
                },
                {
                  key: 'download',
                  label: t('inference:viewer.actions.download.label'),
                  icon: 'download' as const,
                  onClick: handleDownload,
                  aria: t('inference:viewer.actions.download.aria'),
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
      <div className={`${styles.thumbnailStrip}`} ref={stripRef}>
        {visibleThumbnails.map((thumbnail, index) => {
          const hasImage = Boolean(thumbnail.webImageUrl || thumbnail.imageUrl);
          const generating = (thumbnail.status === 'running' || thumbnail.status === 'queued') && !hasImage;
          return (
          <div
            key={thumbnail.id}
            className={`${styles.thumbnailItem} ${getThumbArClass(thumbnail)} ${
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
                    alt={t('inference:viewer.alt.thumbnail', { index: index + 1 })}
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

// Apply custom class to dialog content wrapper
(InferenceImageViewerDialog as any).dialogContentClassNameDefault = styles.dialogContentViewer;
