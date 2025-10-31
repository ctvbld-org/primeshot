'use client'

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@primeshot/common/web/Icon'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { StylePreviewCard } from './StylePreviewCard'
import { parseStyleImageFilenames } from '@/lib/utils/parse-style-image-metadata'
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

  const handleClose = useCallback(() => {
    closeDialog()
  }, [closeDialog])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Parse metadata from filenames
  const parsedImages = useMemo(() => {
    return parseStyleImageFilenames(previewImages)
  }, [previewImages])

  if (!previewImages || previewImages.length === 0 || parsedImages.length === 0) {
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
            <div key={`${metadata.filename}-${index}`} className={styles.imageCard}>
              <StylePreviewCard
                image={`placeholders/styles/${metadata.filename}`}
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
