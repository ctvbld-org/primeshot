import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import styles from './upload-footer.module.css'

interface UploadFooterProps {
  acceptedFiles?: File[]
  minImages: number
  maxImages: number
  onReviewClick: () => void
  isUploading: boolean
}

export function UploadFooter({
  acceptedFiles = [],
  minImages,
  maxImages,
  onReviewClick,
  isUploading
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
      const squareIndex = startIndex + i + 1
      const fileUrl = fileUrls[startIndex + i]
      return (
        <div
          key={i}
          className={cn(
            isRequired ? styles.square : styles.squareOptional,
            fileUrl ? styles.squareActive : ''
          )}
        >
          {fileUrl ? (
            <img 
              src={fileUrl}
              alt={`Photo ${squareIndex}`}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            squareIndex
          )}
        </div>
      )
    })
  }

  return (
    <div className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.countWrapper}>
          <span className={styles.count}>{count}</span>
          <p className={styles.countLabel}>
            {t('status.photosLabel')}
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