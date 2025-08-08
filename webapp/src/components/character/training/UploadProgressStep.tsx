'use client'

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ThumbnailStyles.module.css'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'

interface UploadProgressStepProps {
  progress: number
  totalFiles: number
  retryState?: { attempt: number; maxRetries: number; error?: Error } | null
  currentUploadingFile?: File | null
  uploadedFiles?: File[]
}

export function UploadProgressStep({ progress, totalFiles, retryState, currentUploadingFile, uploadedFiles = [] }: UploadProgressStepProps) {
  const { t } = useTranslation('upload')
  
  const uploadedCount = Math.floor((progress / 100) * totalFiles)

  // Keep showing a thumbnail between the last upload finishing and training starting
  const currentThumbnail = useMemo(() => {
    const fallback = uploadedFiles.length > 0 ? uploadedFiles[uploadedFiles.length - 1] : null
    const fileToShow = currentUploadingFile ?? fallback
    if (!fileToShow) return null
    return URL.createObjectURL(fileToShow)
  }, [currentUploadingFile, uploadedFiles])

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-12">
      {/* Current Image Thumbnail */}
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnail}>
          {currentThumbnail && (
            <img 
              src={currentThumbnail}
              alt="Current uploading image"
              className={styles.thumbnailImage}
            />
          )}
          <CircleProgress 
            value={0}
            size={96} 
            thickness={4}
            className="rounded-[30px]"
          />
        </div>
      </div>

      {/* Status Text */}
      <div className={styles.statusContainer}>
        <h3 className={styles.statusTitle}>
          {retryState?.error ? (
            <span className="text-yellow-400">
              {t('errors.retryError', { message: retryState.error.message })}
            </span>
          ) : (
            <span>
              {t('upload.uploadingFiles')}
              <span className={styles.dots}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </span>
            </span>
          )}
        </h3>
        <p className={styles.statusDescription}>
          {t('upload.uploadingInfo')}
        </p>
      </div>
    </div>
  )
}