'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { Icon } from '@primeshot/common/web/Icon'
import { useDialogService } from '@/contexts/DialogServiceContext'
import styles from './StylePreviewDialog.module.css'

interface StylePreviewDialogProps {
  styleName: string
  previewImages: string[]
  fullscreen?: boolean
  noContainer?: boolean
}

export function StylePreviewDialog({ 
  styleName, 
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

  if (!previewImages || previewImages.length === 0) {
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
          {previewImages.map((imageSrc, index) => (
            <div key={`${imageSrc}-${index}`} className={styles.imageCard}>
              <Image
                loader={makeCloudfrontLoader('app-images/placeholders/styles')}
                src={imageSrc}
                alt={`${styleName} preview ${index + 1}`}
                width={400}
                height={600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={85}
                loading={index < 6 ? 'eager' : 'lazy'}
                decoding="async"
                className={styles.image}
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
