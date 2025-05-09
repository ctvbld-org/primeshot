import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import styles from './upload-footer.module.css'
import { ImageTooltip } from './image-tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ImageQualityResult } from '@/lib/image-quality'

interface UploadFooterProps {
  acceptedFiles?: File[]
  minImages: number
  maxImages: number
  onReviewClick: () => void
  isUploading: boolean
  onRemoveFile: (index: number) => void
  qualityResults: Record<string, ImageQualityResult>
  isAnalyzing: boolean
  currentAnalyzingIndex: number
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
  qualityResults,
  isAnalyzing,
  currentAnalyzingIndex
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

  // 6. Render helpers
  const renderSquare = useCallback((index: number, isRequired: boolean) => {
    const file = acceptedFiles[index]
    const result = file ? qualityResults[file.name] : null
    const isCurrentlyAnalyzing = isAnalyzing && index === currentAnalyzingIndex
    
    let qualityClass = ''
    let qualityLabel = ''
    if (result) {
      if (result.score >= 80) {
        qualityClass = styles.qualityIndicatorHigh
        qualityLabel = t('quality.high')
      } else {
        qualityClass = styles.qualityIndicatorMedium
        qualityLabel = t('quality.medium')
      }
    }

    return (
      <Popover 
        key={index}
        open={openTooltipIndex === index}
        onOpenChange={(open) => handleTooltipOpenChange(open, index)}
      >
        <PopoverTrigger asChild>
          <div
            className={cn(
              isRequired ? styles.square : styles.squareOptional,
              file ? styles.squareActive : '',
              isCurrentlyAnalyzing && styles.squareAnalyzing
            )}
            role="button"
            aria-label={file ? 
              t('accessibility.photoWithQuality', { number: index + 1, quality: qualityLabel }) : 
              t('accessibility.emptyPhotoSlot', { number: index + 1 })
            }
          >
            {file && result?.isAcceptable ? (
              <>
                <img 
                  src={URL.createObjectURL(file)}
                  alt={t('accessibility.photoPreview', { number: index + 1 })}
                  className={cn(
                    "w-full h-full object-cover rounded-lg transition-all duration-300"
                  )}
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                {result && (
                  <div 
                    className={cn(styles.qualityIndicator, qualityClass)}
                    aria-hidden="true"
                  />
                )}
              </>
            ) : (
              index + 1
            )}
          </div>
        </PopoverTrigger>
        {file && result?.isAcceptable && !isCurrentlyAnalyzing && (
          <PopoverContent 
            className="w-auto p-0 border-none shadow-none bg-transparent" 
            align="center"
            side="top"
            sideOffset={16}
          >
            <ImageTooltip
              file={file}
              result={result}
              fileUrl={URL.createObjectURL(file)}
              onClose={() => setOpenTooltipIndex(null)}
              onDelete={() => handleRemoveFile(index)}
            />
          </PopoverContent>
        )}
      </Popover>
    )
  }, [acceptedFiles, qualityResults, openTooltipIndex, handleTooltipOpenChange, handleRemoveFile, t, isAnalyzing, currentAnalyzingIndex])

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