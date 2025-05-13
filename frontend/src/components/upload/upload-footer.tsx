import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import styles from './upload-footer.module.css'
import { ImageTooltip } from './image-tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader } from '@/components/ui/loader'
import { Icon } from '../icons/icon'
import type { FileWithScore } from '@/lib/types'

interface UploadFooterProps {
  acceptedFiles?: FileWithScore[]
  minImages: number
  maxImages: number
  onReviewClick: () => void
  isUploading: boolean
  onRemoveFile: (index: number) => void
  isAnalyzing: boolean
  currentAnalyzingIndex: number
  currentUploadingIndex?: number | null
  uploadedFiles?: string[]
}

interface ScrollState {
  atStart: boolean
  atEnd: boolean
  noScroll: boolean
}

export function UploadFooter({
  acceptedFiles = [],
  minImages,
  maxImages,
  onReviewClick,
  isUploading,
  onRemoveFile,
  isAnalyzing,
  currentAnalyzingIndex,
  currentUploadingIndex = null,
  uploadedFiles = []
}: UploadFooterProps) {
  // 1. Hooks
  const { t } = useTranslation('upload')
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // 2. State
  const [scrollState, setScrollState] = useState<ScrollState>({
    atStart: true,
    atEnd: false,
    noScroll: true
  })
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null)

  // 3. Memoized values
  const count = useMemo(() => acceptedFiles.length, [acceptedFiles])

  // 4. Callbacks
  const handleTooltipOpenChange = useCallback((open: boolean, index: number) => {
    setOpenTooltipIndex(open ? index : null)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setOpenTooltipIndex(null)
    onRemoveFile(index)
  }, [onRemoveFile])

  const checkScroll = useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const { scrollLeft, scrollWidth, clientWidth } = wrapper
    const hasScroll = scrollWidth > clientWidth

    setScrollState({
      atStart: scrollLeft === 0,
      atEnd: Math.abs(scrollWidth - clientWidth - scrollLeft) < 1,
      noScroll: !hasScroll
    })
  }, [])

  // 5. Effects
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    // Check initial state
    checkScroll()

    // Add scroll listener
    wrapper.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      wrapper.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  // Add state for signed URLs
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Add function to fetch signed URL
  const fetchSignedUrl = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/user-images?imageId=${fileId}`)
      if (!response.ok) throw new Error('Failed to fetch signed URL')
      const data = await response.json()
      setSignedUrls(prev => ({ ...prev, [fileId]: data.url }))
    } catch (error) {
      console.error('Error fetching signed URL:', error)
    }
  }, [])

  // Effect to fetch signed URLs for uploaded files
  useEffect(() => {
    acceptedFiles.forEach(file => {
      if (file.id && !signedUrls[file.id]) {
        fetchSignedUrl(file.id)
      }
    })
  }, [acceptedFiles, fetchSignedUrl])

  const getImageUrl = useCallback((file: FileWithScore) => {
    if (!file.id) return URL.createObjectURL(file as Blob)
    return signedUrls[file.id] || null
  }, [signedUrls])

  // 6. Render helpers
  const renderSquare = useCallback((index: number, isRequired: boolean) => {
    const file = acceptedFiles[index]
    const isCurrentlyAnalyzing = isAnalyzing && index === currentAnalyzingIndex
    const isCurrentlyUploading = isUploading && index === currentUploadingIndex
    const isUploaded = file && uploadedFiles.includes(file.name)
    const isPendingUpload = isUploading && file && !isUploaded && index > (currentUploadingIndex || -1)
    
    let qualityClass = ''
    let qualityLabel = ''
    if (file?.score && file.score > 79) {
      qualityClass = styles.qualityIndicatorHigh
      qualityLabel = t('quality.high')
    } else {
      qualityClass = styles.qualityIndicatorMedium
      qualityLabel = t('quality.medium')
    }

    const imageUrl = file ? getImageUrl(file) : null

    // Disable tooltip interaction when uploading
    const popoverTriggerProps = isUploading
      ? { tabIndex: -1, style: { pointerEvents: 'none' as React.CSSProperties['pointerEvents'], cursor: 'not-allowed' as React.CSSProperties['cursor'] } }
      : {}
    const handlePopoverOpenChange = isUploading ? () => {} : (open: boolean) => handleTooltipOpenChange(open, index)

    return (
      <Popover 
        key={index}
        open={openTooltipIndex === index && !isUploading}
        onOpenChange={handlePopoverOpenChange}
      >
        <PopoverTrigger asChild>
          <div
            {...popoverTriggerProps}
            className={cn(
              isRequired ? styles.square : styles.squareOptional,
              file ? styles.squareActive : '',
              isCurrentlyAnalyzing && styles.squareAnalyzing,
              isUploading && file && styles.squareUploading,
              isCurrentlyUploading && styles.squareCurrentlyUploading,
              isPendingUpload && styles.squarePendingUpload,
              isUploaded && styles.squareUploaded
            )}
            role="button"
            aria-label={file ? 
              t('accessibility.photoWithQuality', { number: index + 1, quality: qualityLabel }) : 
              t('accessibility.emptyPhotoSlot', { number: index + 1 })
            }
          >
            {file ? (
              <>
                {imageUrl ? (
                  <img 
                    src={imageUrl}
                    alt={t('accessibility.photoPreview', { number: index + 1 })}
                    className={cn(
                      "w-full h-full object-cover rounded-lg transition-all duration-300",
                      isUploading && !isUploaded && !isCurrentlyUploading && "opacity-60",
                      isCurrentlyUploading && "opacity-70"
                    )}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.startsWith('blob:')) {
                        URL.revokeObjectURL(target.src);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader className="w-6 h-6" />
                  </div>
                )}
                {!isUploading && (
                  <div 
                    className={cn(styles.qualityIndicator, qualityClass)}
                    aria-hidden="true"
                  />
                )}
                {isUploaded && (
                  <Icon 
                    variant="check"
                    className={styles.uploadedIndicator}
                    aria-hidden="true"
                  />
                )}
                {isCurrentlyUploading && (
                  <div className={styles.uploadingIndicator}>
                    <Loader className={styles.uploadingLoader} />
                  </div>
                )}
              </>
            ) : (
              index + 1
            )}
          </div>
        </PopoverTrigger>
        {file && !isCurrentlyAnalyzing && !isCurrentlyUploading && !isUploading && (
          <PopoverContent 
            className="w-auto p-0 border-none shadow-none bg-transparent" 
            align="center"
            side="top"
            sideOffset={16}
          >
            <ImageTooltip
              file={file}
              fileUrl={imageUrl || ''}
              onClose={() => setOpenTooltipIndex(null)}
              onDelete={() => handleRemoveFile(index)}
            />
          </PopoverContent>
        )}
      </Popover>
    )
  }, [acceptedFiles, openTooltipIndex, handleTooltipOpenChange, handleRemoveFile, t, isAnalyzing, currentAnalyzingIndex, isUploading, currentUploadingIndex, uploadedFiles, getImageUrl])

  const generateSquares = useCallback((count: number, isRequired: boolean, startIndex: number = 0) => {
    return Array.from({ length: count }).map((_, i) => renderSquare(startIndex + i, isRequired))
  }, [renderSquare])

  // 7. Render
  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.countWrapper}>
          <span className={cn(styles.count, count >= minImages && styles.countActive)}>
            {count}
          </span>
          <p className={styles.countLabel}>
            {t('status.photosLabel', { count })}
            <span className={styles.countDesc}>
              {t('status.photosRequired', { min: UPLOAD_CONSTANTS.MIN_IMAGES, max: UPLOAD_CONSTANTS.MAX_IMAGES })}
            </span>
          </p>
        </div>
        
        <span className={styles.separator} />
        
        <div className={styles.squares}>
          <div 
            ref={wrapperRef}
            className={cn(
              styles.squaresWrapper,
              'hide-scrollbar',
              scrollState.atStart && styles.atStart,
              scrollState.atEnd && styles.atEnd,
              scrollState.noScroll && styles.noScroll
            )}
          >
            <div className={styles.squaresContainer}>
              {/* Required photos */}
              <div className={styles.squareGroup}>
                {generateSquares(minImages, true)}
              </div>
              {/* Line separator */}
              <span className={styles.separatorImg} />
              {/* Optional additional photos */}
              <div className={styles.squareGroup}>
                {generateSquares(maxImages - minImages, false, minImages)}
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={onReviewClick}
          disabled={count < minImages || isUploading}
          className={styles.reviewButton}
          loading={isUploading}
        >
          {isUploading ? t('buttons.uploading') : t('buttons.review')}
        </Button>
      </div>
    </div>
  )
} 