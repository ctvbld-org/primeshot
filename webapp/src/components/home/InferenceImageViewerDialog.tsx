'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@primeshot/common/web/Icon';
import { useDialogService } from '@/contexts/DialogServiceContext';
import { InferenceJob } from '@/hooks/useInferenceQueue';
import { InferenceThumbnail } from '@/components/home/InferenceThumbnail';
import { getInferenceImageOriginal, getInferenceImageThumbnail, getInferenceImageCard } from '@/lib/utils/get-inference-image';
import styles from './InferenceImageViewerDialog.module.css';
import { useStyle, useScene, useWardrobe, useColor, useSceneById, useWardrobeById, useColorById } from '@/hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '@/lib/api/client';

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
  const { t } = useTranslation(['styles']);

  const currentThumbnail = job.thumbnails[currentImageIndex];
  const completedThumbnails = job.thumbnails.filter(thumb => thumb.status === 'completed');

  // Helper to detect UUID vs value codes (copied from group component)
  const isUuid = (v?: string) => !!v && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(v);
  const useSceneHook = isUuid(job.sceneId) ? useSceneById : useScene;
  const useWardrobeHook = isUuid(job.wardrobeId) ? useWardrobeById : useWardrobe;
  const useColorHook = isUuid(job.colorId) ? useColorById : useColor;

  const { data: styleData } = useStyle(job.styleId as any);
  const { data: sceneData } = useSceneHook((job.sceneId || undefined) as any);
  const { data: wardrobeData } = useWardrobeHook((job.wardrobeId || undefined) as any);
  const { data: colorData } = useColorHook((job.colorId || undefined) as any);

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
      const raw = job.characterThumbnailUrl;
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
  }, [job.characterThumbnailUrl]);

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

  // Prefetch neighbor images (±2) for snappier navigation
  useEffect(() => {
    const neighborOffsets = [-2, -1, 1, 2];
    const total = job.thumbnails.length;
    for (const offset of neighborOffsets) {
      const idx = (currentImageIndex + offset + total) % total;
      const neighbor = job.thumbnails[idx];
      if (!neighbor || neighbor.status !== 'completed') continue;
      const base = neighbor.webImageUrl || neighbor.imageUrl || '';
      if (!base) continue;
      preloadImage(base);
      // Also warm 480/720 used by thumbnails
      preloadImage(getInferenceImageThumbnail(base));
      preloadImage(getInferenceImageCard(base));
    }

    // Idle prefetch the original for the current image (useful for immediate download)
    const base = currentThumbnail?.webImageUrl || currentThumbnail?.imageUrl || '';
    const original = base ? getInferenceImageOriginal(base) : '';
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
    if (original) {
      if (typeof ric === 'function') {
        ric(() => preloadImage(original));
      } else {
        // Fallback to setTimeout if requestIdleCallback isn't available
        setTimeout(() => preloadImage(original), 0);
      }
    }
  }, [currentImageIndex, job.thumbnails, currentThumbnail]);

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
    link.download = `primeshot-shoot-${shootNumber.toString().padStart(3, '0')}-img-${currentImageIndex + 1}.png`;
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
  // Format aspect ratio with orientation
  const aspectRatioText = useMemo(() => {
    const v = job.aspectRatio || '';
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
  }, [job.aspectRatio]);

  const qualityText = useMemo(() => (job.quality ? String(job.quality).toUpperCase() : ''), [job.quality]);

  // Time ago helper
  const timeAgoText = useMemo(() => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - job.createdAt.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }, [job.createdAt]);

  // Prefer web variant for faster display; fallback to original
  const mainImageUrl = currentThumbnail.webImageUrl || currentThumbnail.imageUrl || '';
  
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

      {/* Main image area */
      }
      <div className={styles.imageArea}>
        {imageLoading && (
          <div className={styles.imageLoading}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        {mainImageUrl && (
          <img
            src={mainImageUrl}
            alt={`Generated image ${currentImageIndex + 1}`}
            className={styles.mainImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="eager"
            decoding="async"
            style={{ opacity: imageLoading ? 0 : 1 }}
          />
        )}
        {/* Floating download original button */}
        <button
          className={styles.downloadOriginalButton}
          onClick={() => {
            const base = currentThumbnail.webImageUrl || currentThumbnail.imageUrl || '';
            if (!base) return;
            const original = getInferenceImageOriginal(base);
            const link = document.createElement('a');
            link.href = original;
            link.download = `primeshot-shoot-${shootNumber.toString().padStart(3, '0')}-img-${currentImageIndex + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          aria-label="Download original image"
          disabled={!currentThumbnail.webImageUrl && !currentThumbnail.imageUrl}
        >
          <Icon variant="download" size={20} />
        </button>
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        {/* Image metadata */}
        <div className={styles.metadata}>
          <h3 className={styles.title}>
            Shoot {shootNumber} IMG {currentImageIndex + 1}
          </h3>
          {!!subtitle && (
            <div className={styles.subtitle}>{subtitle}</div>
          )}
          
          <div className={styles.metadataGrid}>
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Aspect Ratio</span>
              <span className={styles.metadataValue}>{aspectRatioText}</span>
            </div>
            
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Quality</span>
              <span className={styles.metadataValue}>{qualityText}</span>
            </div>
            
            <div className={styles.metadataItem}>
              <span className={styles.metadataLabel}>Model</span>
              <span className={styles.metadataValue}>Primeshot v1</span>
            </div>
          </div>

          {/* Character block */}
          {(job.characterName || characterImageUrl) && (
            <div className={styles.characterBlock}>
              <div className={styles.metadataLabel}>Character</div>
              <div className={styles.characterRow}>
                {characterImageUrl && (
                  <img src={characterImageUrl} alt={job.characterName || 'Character'} className={styles.characterAvatar} />
                )}
                <span className={styles.characterName}>{job.characterName || ''}</span>
              </div>
            </div>
          )}

          <div className={styles.timeAgo}>{timeAgoText}</div>
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
        ))}
      </div>
    </div>
  );
};
