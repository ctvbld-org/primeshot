'use client'

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@primeshot/common/web/Icon'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { StylePreviewCard } from './StylePreviewCard'
import { parseStyleImageFilename, type StyleImageMetadata } from '@/lib/utils/parse-style-image-metadata'
import { useExploreImages } from '@/hooks/useExploreImages'
import styles from './StylePreviewDialog.module.css'

interface StylePreviewDialogProps {
  styleName: string
  styleId: string
  previewImages: string[]
  fullscreen?: boolean
  noContainer?: boolean
}

export function StylePreviewDialog({ 
  styleName,
  styleId,
  previewImages,
  fullscreen = true,
  noContainer = true 
}: StylePreviewDialogProps) {
  const { t } = useTranslation(['styles', 'common'])
  const { closeDialog } = useDialogService()
  
  // Fetch explore images from database by checking which preview images exist
  const { images: exploreImages, isLoading: isLoadingExplore, error: exploreError } = useExploreImages(previewImages)

  const handleClose = useCallback(() => {
    closeDialog()
  }, [closeDialog])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Parse metadata from filenames
  // Use explore images if available, fallback to preview images
  const parsedImages = useMemo(() => {
    let imagesToParse: string[] = []
    let needsPrefix = false

    if (!isLoadingExplore && exploreImages.length > 0) {
      // Use explore images (already have full path)
      imagesToParse = exploreImages.map(img => img.image)
      needsPrefix = false
    } else {
      // Use preview images (just filenames, need prefix)
      imagesToParse = previewImages
      needsPrefix = true
    }

    // Parse filenames, removing path prefix if present
    const parsed = imagesToParse
      .map(imagePath => {
        // Remove "placeholders/styles/" prefix from filename before parsing
        const filename = imagePath.replace(/^placeholders\/styles\//i, '')
        const metadata = parseStyleImageFilename(filename)
        
        if (!metadata) {
          console.warn('Failed to parse filename:', imagePath)
          return null
        }
        
        // Return metadata with the full image path
        return {
          ...metadata,
          imagePath: needsPrefix ? `placeholders/styles/${filename}` : imagePath
        }
      })
      .filter((metadata): metadata is StyleImageMetadata & { imagePath: string } => metadata !== null)
    
    return parsed
  }, [exploreImages, isLoadingExplore, previewImages])

  if (parsedImages.length === 0) {
    return (
      <div className={styles.container} onClick={handleBackdropClick}>
        <div className={styles.header}>
          <h2 className={styles.title}>{styleName}</h2>
          <button 
            onClick={handleClose}
            className={styles.closeButton}
            aria-label={t('buttons.close', { ns: 'common' })}
          >
            <Icon variant="cross" size={24} />
          </button>
        </div>
        <div className={styles.emptyState}>
          <p>{t('messages.noPreviewImages', { ns: 'styles' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} onClick={handleBackdropClick}>
      <div className={styles.header}>
        <h2 className={styles.title}>{styleName}</h2>
        <button 
          onClick={handleClose}
          className={styles.closeButton}
          aria-label={t('buttons.close', { ns: 'common' })}
        >
          <Icon variant="cross" size={24} />
        </button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.masonry}>
          {parsedImages.map((metadata, index) => (
            <div 
              key={`${metadata.filename}-${index}`} 
              className={styles.imageCard}
            >
              <StylePreviewCard
                image={metadata.imagePath}
                aspectRatio={metadata.aspectRatio}
                resolution={metadata.resolution}
                style={metadata.style}
                styleFormatted={metadata.styleFormatted}
                scene={metadata.scene}
                wardrobe={metadata.wardrobe}
                color={metadata.color}
                priority={index < 6}
                styleId={styleId}
                onGenerate={handleClose}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Set default props for dialog service integration
StylePreviewDialog.defaultProps = {
  fullscreen: true,
  noContainer: true
}
