import React, { useMemo, useCallback } from 'react'
import { Button } from '@primeshot/common/web/ui/button'
import { ImageQualityScore } from './ImageQualityScore'
import { ImageQualityResult, checkBodyShotRequirements } from '@/lib/image-quality'
import { useTranslation } from 'react-i18next'
import styles from './RejectedImagesContent.module.css'
import type { FileWithScore } from '@/lib/types'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { Icon } from '@primeshot/common/web/Icon'

interface RejectedImagesContentProps {
  files: FileWithScore[]
  totalFiles: number
  qualityResults: Record<string, ImageQualityResult>
  onRemoveFile: (index: number) => void
  onContinue: () => void
}

export function RejectedImagesContent({
  files,
  totalFiles,
  qualityResults,
  onRemoveFile,
  onContinue
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

  const bodyShotValidation = useMemo(() => {
    const acceptedResults = Object.fromEntries(acceptedEntries)
    return checkBodyShotRequirements(acceptedResults)
  }, [acceptedEntries])

  const shouldShowBodyShotError = useMemo(() =>
    acceptedEntries.length >= UPLOAD_CONSTANTS.MIN_IMAGES && !bodyShotValidation.isValid,
    [acceptedEntries.length, bodyShotValidation.isValid]
  )

  const bodyShotErrorMessages = useMemo(() =>
    bodyShotValidation.i18nErrors?.map(err => tCharacter(err.key as any, err.params)) ?? [],
    [bodyShotValidation.i18nErrors, tCharacter]
  )
  
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
  if (rejectedFiles.length === 0 && !shouldShowBodyShotError) {
    return null
  }

  // 5. Render
  return (
    <div className="bg-[#0A0A0B] border-b border-[#202A32] p-6">
      <div className={styles.header}>
        <svg width="40" height="41" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 3C16.5388 3 13.1554 4.02636 10.2775 5.94928C7.39967 7.87221 5.15665 10.6053 3.83212 13.803C2.50758 17.0007 2.16102 20.5194 2.83627 23.9141C3.51151 27.3087 5.17822 30.4269 7.62564 32.8744C10.0731 35.3218 13.1913 36.9885 16.5859 37.6637C19.9806 38.339 23.4993 37.9924 26.697 36.6679C29.8947 35.3434 32.6278 33.1003 34.5507 30.2225C36.4737 27.3446 37.5 23.9612 37.5 20.5C37.5 15.8587 35.6563 11.4075 32.3744 8.12563C29.0925 4.84374 24.6413 3 20 3ZM20 35.5C17.0333 35.5 14.1332 34.6203 11.6665 32.972C9.19972 31.3238 7.27713 28.9811 6.14181 26.2403C5.0065 23.4994 4.70945 20.4834 5.28823 17.5736C5.86701 14.6639 7.29562 11.9912 9.39341 9.8934C11.4912 7.79561 14.1639 6.367 17.0737 5.78822C19.9834 5.20944 22.9994 5.50649 25.7403 6.64181C28.4811 7.77712 30.8238 9.69971 32.472 12.1664C34.1203 14.6332 35 17.5333 35 20.5C35 24.4782 33.4197 28.2936 30.6066 31.1066C27.7936 33.9196 23.9783 35.5 20 35.5Z" fill="#FF4242"/>
          <path d="M14.375 14.25C13.7569 14.25 13.1528 14.4333 12.6389 14.7767C12.1249 15.12 11.7244 15.6081 11.4879 16.1791C11.2514 16.7501 11.1895 17.3785 11.3101 17.9847C11.4306 18.5908 11.7283 19.1477 12.1653 19.5847C12.6023 20.0217 13.1592 20.3194 13.7654 20.44C14.3715 20.5605 14.9999 20.4986 15.5709 20.2621C16.1419 20.0256 16.63 19.6251 16.9734 19.1112C17.3167 18.5973 17.5 17.9931 17.5 17.375C17.5 16.5462 17.1708 15.7513 16.5847 15.1653C15.9987 14.5792 15.2038 14.25 14.375 14.25Z" fill="#FF4242"/>
          <path d="M25.625 14.25C25.0069 14.25 24.4028 14.4333 23.8889 14.7767C23.3749 15.12 22.9744 15.6081 22.7379 16.1791C22.5014 16.7501 22.4395 17.3785 22.5601 17.9847C22.6806 18.5908 22.9783 19.1477 23.4153 19.5847C23.8523 20.0217 24.4092 20.3194 25.0154 20.44C25.6215 20.5605 26.2499 20.4986 26.8209 20.2621C27.3919 20.0256 27.88 19.6251 28.2234 19.1112C28.5667 18.5973 28.75 17.9931 28.75 17.375C28.75 16.5462 28.4208 15.7513 27.8347 15.1653C27.2487 14.5792 26.4538 14.25 25.625 14.25Z" fill="#FF4242"/>
          <path d="M20 24.25C18.2745 24.2529 16.5792 24.7022 15.0788 25.5543C13.5784 26.4064 12.324 27.6322 11.4375 29.1125L13.575 30.3625C14.2421 29.2547 15.1842 28.3383 16.31 27.7021C17.4358 27.0659 18.7069 26.7315 20 26.7315C21.2931 26.7315 22.5642 27.0659 23.69 27.7021C24.8158 28.3383 25.7579 29.2547 26.425 30.3625L28.5625 29.1125C27.6761 27.6322 26.4216 26.4064 24.9212 25.5543C23.4208 24.7022 21.7255 24.2529 20 24.25Z" fill="#FF4242"/>
        </svg>
        <h2 className={styles.headerTitle}>
          {shouldShowBodyShotError ? (
            tCharacter('uploadStep.bodyShotRequirementsNotMet')
          ) : (
            t('quality.rejected.title', {
              rejected: counts.rejected,
              total: counts.total,
              count: counts.total
            })
          )}
        </h2>
      </div>

      {shouldShowBodyShotError && (
        <div className={styles.bodyShotError}>
          <ul className={styles.bodyShotErrorList}>
            {bodyShotErrorMessages.map((msg, idx) => (
              <li key={idx}><Icon variant="cross" size={16} /> {msg}</li>
            ))}
          </ul>
        </div>
      )}
      {renderRejectedFiles}
    </div>
  )
}