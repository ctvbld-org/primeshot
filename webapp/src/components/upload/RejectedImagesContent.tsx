import React, { useMemo, useCallback } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { ImageQualityScore } from './ImageQualityScore'
import { ImageQualityResult } from '@/lib/image-quality'
import { useTranslation } from 'react-i18next'
import styles from './RejectedImagesContent.module.css'
import type { FileWithScore } from '@/lib/types'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

interface RejectedImagesContentProps {
  files: FileWithScore[]
  totalFiles: number
  qualityResults: Record<string, ImageQualityResult>
  onRemoveFile: (index: number) => void
  onContinue: () => void
  canBypassQuality?: boolean
  rejectedCount?: number
  onBypassQuality?: () => void
}

export function RejectedImagesContent({
  files,
  totalFiles,
  qualityResults,
  onRemoveFile,
  onContinue,
  canBypassQuality = false,
  rejectedCount = 0,
  onBypassQuality
}: RejectedImagesContentProps) {
  // 1. Hooks
  const { t } = useTranslation('upload')
  const { t: tCharacter } = useTranslation('character')

  // 2. Memoized values
  const rejectedFiles = useMemo(() => 
    files.filter(file => !qualityResults[file.name]?.isAcceptable),
    [files, qualityResults]
  )

  const counts = useMemo(() => ({
    rejected: rejectedFiles.length,
    total: totalFiles
  }), [rejectedFiles.length, totalFiles])

  // Body-shot validation computed from accepted images only
  const acceptedEntries = useMemo(() =>
    Object.entries(qualityResults).filter(([, r]) => r?.isAcceptable),
    [qualityResults]
  )

  // Sidebar no longer shows body shot errors; keep accepted count to decide if we render at all
  const shouldShowBodyShotError = false
  
  // 3. Callbacks
  const handleRemoveFile = useCallback((index: number) => {
    onRemoveFile(index)
  }, [onRemoveFile])

  // 4. Render helpers
  const renderRejectedFiles = useMemo(() => (
    <div className={styles.rejectedFilesList}>
      {rejectedFiles.map((file, index) => (
        <ImageQualityScore
          key={file.name}
          file={file}
          result={qualityResults[file.name]}
          onRemove={() => handleRemoveFile(files.indexOf(file))}
          isUploading={false}
          progress={0}
          variant="rejected"
        />
      ))}
    </div>
  ), [rejectedFiles, qualityResults, handleRemoveFile, files])

  // Don't render if nothing to show
  if (rejectedFiles.length === 0) {
    return null
  }

  // 5. Render
  return (
    <div className="bg-[#0A0A0B] border-b border-[#202A32] p-6">
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          {t('quality.rejected.oops')}
        </h2>
        <p className={styles.headerDescription}>
          {t('quality.rejected.title', {
            rejected: counts.rejected,
            total: counts.total,
            count: counts.total
          })} 
        </p>  
        {canBypassQuality && onBypassQuality && (
          <div className={styles.bypassSection}>
            <p className={styles.bypassWarningTitle}>
              {t('quality.rejected.description')}
            </p>
            <ul className={styles.bypassWarningList}>
              <li>{t('quality.rejected.lessVariety')}</li>
              <li>{t('quality.rejected.lowerQuality')}</li>
              <li>{t('quality.rejected.notLookLike')}</li>
            </ul>
            <Button 
              variant="secondary" 
              onClick={onBypassQuality}
              className={styles.bypassButton}
            >
              {t('quality.rejected.button')}
            </Button>
          </div>
        )}
      </div>
      {renderRejectedFiles}
    </div>
  )
}