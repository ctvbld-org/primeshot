import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import styles from './UploadFooter.module.css'
import { ImageTooltip } from './ImageTooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@primeshot/common/web/ui/popover'
import { Loader } from '@primeshot/common/web/ui/loader'
import { Icon } from '@primeshot/common/web/Icon'
import type { FileWithScore } from '@/lib/types'
import { getApiUrl } from '@primeshot/common'

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
  onEmptySquareClick?: () => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  disabled?: boolean
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
  uploadedFiles = [],
  onEmptySquareClick,
  onDrop,
  onDragOver,
  onDragLeave,
  disabled = false
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
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)

  // 3a. Refs for Object URL caching / cleanup (moved up so callbacks can reference them)
  const objectUrlCache = useRef(new WeakMap<File, string>()).current
  const urlsToCleanup = useRef(new Set<string>()).current



  // 4. Callbacks
  const handleTooltipOpenChange = useCallback((open: boolean, index: number) => {
    setOpenTooltipIndex(open ? index : null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragging(false)
    onDrop?.(e)
  }, [disabled, onDrop])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
      onDragOver?.(e)
    }
  }, [disabled, onDragOver])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    onDragLeave?.(e)
  }, [onDragLeave])

  // Immediately revoke object URL if the user removes a file mid-session to avoid memory leaks
  const handleRemoveFile = useCallback((index: number) => {
    setOpenTooltipIndex(null)

    const file = acceptedFiles[index]
    if (file instanceof File && objectUrlCache.has(file)) {
      const url = objectUrlCache.get(file)!
      URL.revokeObjectURL(url)
      urlsToCleanup.delete(url)
      objectUrlCache.delete(file)
    }

    onRemoveFile(index)
  }, [acceptedFiles, onRemoveFile, objectUrlCache, urlsToCleanup])

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

  // Function to fetch signed URL
  const fetchSignedUrl = useCallback(async (file: FileWithScore) => {
    if (!file.url || !file.id) return null;
    
    try {
      const params = new URLSearchParams();
      params.append('imageId', file.id);
      const response = await fetch(getApiUrl(`/api/user-images?${params.toString()}`));
      if (!response.ok) throw new Error('Failed to fetch signed URL');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      return null;
    }
  }, []);

  // Effect to fetch signed URLs for uploaded files
  useEffect(() => {
    const fetchUrls = async () => {
      const newSignedUrls: Record<string, string> = {}
      
      for (const file of acceptedFiles) {
        if (file.id && file.url && !signedUrls[file.url]) {
          const signedUrl = await fetchSignedUrl(file)
          if (signedUrl) {
            newSignedUrls[file.url] = signedUrl
          }
        }
      }
      
      if (Object.keys(newSignedUrls).length > 0) {
        setSignedUrls(prev => ({ ...prev, ...newSignedUrls }))
      }
    }

    fetchUrls()
  }, [acceptedFiles, fetchSignedUrl])

  const getImageUrl = useCallback((file: FileWithScore) => {
    if (!file.id || !file.url) {
      // Check if file is actually a File object
      if (file instanceof File) {
        if (!objectUrlCache.has(file)) {
          const url = URL.createObjectURL(file)
          objectUrlCache.set(file, url)
          urlsToCleanup.add(url)
        }
        return objectUrlCache.get(file)!
      }
      // Fallback if somehow we get an invalid file
      console.warn('Invalid file object received:', file)
      return ''
    }
    
    return signedUrls[file.url] ?? ''
  }, [signedUrls])

  // Add cleanup effect for Object URLs
  useEffect(() => {
    return () => {
      urlsToCleanup.forEach((url: string) => URL.revokeObjectURL(url))
    }
  }, [urlsToCleanup])

  // 6. Render helpers
  const renderSquare = useCallback((index: number, isRequired: boolean) => {
    const file = acceptedFiles[index]
    const isCurrentlyAnalyzing = isAnalyzing && index === currentAnalyzingIndex
    const isCurrentlyUploading = isUploading && index === currentUploadingIndex
    const isUploaded = file && uploadedFiles.includes(file.name)
    const isPendingUpload = isUploading && file && !isUploaded && index > (currentUploadingIndex || -1)
    
    let qualityClass = ''
    let qualityLabel = ''
    const hasQualityScore = file?.score && file.score > 0
    if (hasQualityScore && file.score && file.score >= 75) {
      qualityClass = styles.qualityIndicatorHigh
      qualityLabel = t('quality.high')
    } else if (hasQualityScore && file.score && file.score >= 60) {
      qualityClass = styles.qualityIndicatorMedium
      qualityLabel = t('quality.medium')
    } else if (hasQualityScore && file.score && file.score < 60) {
      qualityClass = styles.qualityIndicatorLow
      qualityLabel = t('quality.low')
    }

    const imageUrl = file ? getImageUrl(file) : null
    
    // Disable tooltip interaction when uploading or analyzing
    const isInteractionDisabled = isUploading || isAnalyzing
    const popoverTriggerProps = isInteractionDisabled
      ? { tabIndex: -1, style: { pointerEvents: 'none' as React.CSSProperties['pointerEvents'], cursor: 'default' as React.CSSProperties['cursor'] } }
      : {}
    const handlePopoverOpenChange = isInteractionDisabled ? () => {} : (open: boolean) => handleTooltipOpenChange(open, index)

    return (
      <Popover 
        key={index}
        open={openTooltipIndex === index && !isInteractionDisabled}
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
            onClick={() => {
              if (!file && !isUploading) {
                onEmptySquareClick?.()
              }
            }}
            aria-label={file ? 
              t('accessibility.photoWithQuality', { number: index + 1, quality: qualityLabel }) : 
              t('accessibility.emptyPhotoSlot', { number: index + 1 })
            }
          >
            {file && imageUrl && (
              <>
                <img 
                  src={imageUrl}
                  alt={t('accessibility.photoPreview', { number: index + 1 })}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    isCurrentlyAnalyzing && "opacity-60",
                    isUploading && !isUploaded && !isCurrentlyUploading && "opacity-60",
                    isCurrentlyUploading && "opacity-70"
                  )}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Remove URL revocation since we're now caching URLs
                    // and cleaning up on unmount
                  }}
                />
                {!isUploading && hasQualityScore && (
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
            )}
          </div>
        </PopoverTrigger>
        {file && !isCurrentlyAnalyzing && !isCurrentlyUploading && !isInteractionDisabled && (
          <PopoverContent 
            className={styles.popoverContent}
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

  // 7. Render
  return (
    <div 
      className={cn(
        styles.footer,
        isDragging && styles.footerDragging
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className={styles.footerContent}>        
        <div className={styles.squares}>
          <div 
            ref={wrapperRef}
            className={cn(
              styles.squaresWrapper,
              scrollState.atStart && styles.atStart,
              scrollState.atEnd && styles.atEnd,
              scrollState.noScroll && styles.noScroll,
              isDragging && styles.squaresWrapperDragging
            )}
          >
            <div className={styles.squaresContainer}>
              {/* Required photos */}
              <div className={styles.squareGroup}>
                {Array.from({ length: minImages }).map((_, i) => renderSquare(i, true))}
              </div>
              {/* Optional additional photos */}
              {/* <div className={styles.squareGroup}>
                {Array.from({ length: maxImages - minImages }).map((_, i) => renderSquare(i + minImages, false))}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 