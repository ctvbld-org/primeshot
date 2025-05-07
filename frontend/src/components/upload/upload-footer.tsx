import React, { useState, useEffect, useRef } from 'react'
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
}

export function UploadFooter({
  acceptedFiles = [],
  minImages,
  maxImages,
  onReviewClick,
  isUploading,
  onRemoveFile,
  qualityResults
}: UploadFooterProps) {
  const { t } = useTranslation('upload')
  const [fileUrls, setFileUrls] = useState<string[]>([])
  const count = acceptedFiles.length
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({
    atStart: true,
    atEnd: false,
    noScroll: true
  })
  const [openTooltipIndex, setOpenTooltipIndex] = useState<number | null>(null)

  // Create object URLs for image previews
  useEffect(() => {
    if (!acceptedFiles?.length) return

    const urls = acceptedFiles.map(file => URL.createObjectURL(file))
    setFileUrls(urls)

    // Cleanup URLs on unmount
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [acceptedFiles])

  // Handle scroll detection
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = wrapper
      const hasScroll = scrollWidth > clientWidth

      setScrollState({
        atStart: scrollLeft === 0,
        atEnd: Math.abs(scrollWidth - clientWidth - scrollLeft) < 1,
        noScroll: !hasScroll
      })
    }

    // Check initial state
    checkScroll()

    // Add scroll listener
    wrapper.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    // Cleanup
    return () => {
      wrapper.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  // Generate squares for visualization
  const generateSquares = (count: number, isRequired: boolean, startIndex: number = 0) => {
    return Array.from({ length: count }).map((_, i) => {
      const squareIndex = startIndex + i
      const fileUrl = fileUrls[squareIndex]
      const file = acceptedFiles[squareIndex]
      const result = file ? qualityResults[file.name] : null
      
      // Determine quality indicator class
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
          key={i}
          open={openTooltipIndex === squareIndex}
          onOpenChange={(open) => setOpenTooltipIndex(open ? squareIndex : null)}
        >
          <PopoverTrigger asChild>
            <div
              className={cn(
                isRequired ? styles.square : styles.squareOptional,
                fileUrl ? styles.squareActive : ''
              )}
              role="button"
              aria-label={fileUrl ? 
                t('accessibility.photoWithQuality', { 
                  number: squareIndex + 1, 
                  quality: qualityLabel 
                }) : 
                t('accessibility.emptyPhotoSlot', { number: squareIndex + 1 })
              }
            >
              {fileUrl ? (
                <>
                  <img 
                    src={fileUrl}
                    alt={t('accessibility.photoPreview', { number: squareIndex + 1 })}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {result && (
                    <div 
                      className={cn(styles.qualityIndicator, qualityClass)}
                      aria-hidden="true"
                    />
                  )}
                </>
              ) : (
                squareIndex + 1
              )}
            </div>
          </PopoverTrigger>
          {file && fileUrl && result && (
            <PopoverContent 
              className="w-auto p-0 border-none shadow-none bg-transparent" 
              align="center"
              side="top"
              sideOffset={16}
            >
              <ImageTooltip
                file={file}
                result={result}
                fileUrl={fileUrl}
                onClose={() => setOpenTooltipIndex(null)}
                onDelete={() => {
                  setOpenTooltipIndex(null)
                  onRemoveFile(squareIndex)
                }}
              />
            </PopoverContent>
          )}
        </Popover>
      )
    })
  }

  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.countWrapper}>
          <span className={count < minImages ? styles.count : styles.count + ' ' + styles.countActive}>{count}</span>
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
        >
          {t('buttons.review')}
        </Button>
      </div>
    </div>
  )
} 