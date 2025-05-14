'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@/components/ui/use-toast'
import dynamic from 'next/dynamic'
import { useWindowSize } from '@/lib/hooks/use-window-size'
import { paymentEvents, PAYMENT_EVENTS } from '@/lib/events/payment'

import { FileUploader } from '@/components/upload/file-uploader'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { UploadFooter } from '@/components/upload/upload-footer'
import { RejectedImagesDialog } from '@/components/upload/rejected-images-dialog'

import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useOrder } from '@/lib/hooks/use-order'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { useAuth } from '@/contexts/auth-context'
import { UploadPageSkeleton } from '@/components/skeleton/upload/page'
import type { FileWithScore } from '@/lib/types'
import { useOrderImages } from '@/lib/hooks/use-order-images'

// Import Confetti dynamically to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

// Constants
const CONFETTI_DURATION = 3000
const CONFETTI_CONFIG = {
  numberOfPieces: 300,
  recycle: false,
  gravity: 0.1,
  initialVelocityY: 10,
  colors: ['#44E3C9', '#FF973C', '#C0CED8']
}

export default function UploadPage() {
  // 1. All hooks must be called before any conditional returns
  const { width, height } = useWindowSize()
  const { t } = useTranslation(['upload', 'payment'])
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { updateProgress, clearProgress } = useUserProgress()
  
  const { 
    order,
    isLoading: isLoadingOrder,
    error: orderError,
    isVerifying,
    isVerified
  } = useOrder({ 
    sessionId: searchParams.get('session_id'),
    loadStyles: false
  })

  const { images: existingImages, isLoading: isLoadingImages } = useOrderImages(order?.id)

  const [showConfetti, setShowConfetti] = useState<boolean | 'stopping'>(false)
  const [isTransitioningToReview, setIsTransitioningToReview] = useState(false)

  // 5. State hooks
  const [uploadState, setUploadState] = useState({
    uploadedCount: 0,
    showRejectedDialog: false,
    shownRejectedFiles: [] as string[],
    isVerifyingFiles: false,
    isAnalyzing: false,
    isUploading: false,
    uploadProgress: 0,
    uploadedFiles: [] as string[],
    qualityResults: {} as Record<string, { isAcceptable: boolean; reason?: string }>,
    rejectedFiles: [] as string[],
    currentUploadingIndex: null as number | null
  })

  // 6. Custom hooks
  const {
    files: selectedFiles,
    qualityResults,
    isUploading,
    addFiles,
    removeFile,
    uploadFile,
    clearRejectedFiles,
    handleNewFiles,
    isAnalyzing,
    analyzingCount,
    currentFileIndex,
  } = useFileUpload({
    existingImages: existingImages
  })
  
  // 7. Memoized values
  const acceptedFiles = useMemo(() => {
    return selectedFiles
      .filter(file => qualityResults[file.name]?.isAcceptable)
      .map(file => {
        const fileWithScore = file as FileWithScore;
        fileWithScore.score = Math.round(qualityResults[file.name]?.score);
        return fileWithScore;
      });
  }, [selectedFiles, qualityResults])

  const rejectedFiles = useMemo(() => 
    selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable).map(file => {
      const fileWithScore = file as FileWithScore;
      fileWithScore.score = Math.round(qualityResults[file.name]?.score);
      return fileWithScore;
    }),
    [selectedFiles, qualityResults]
  )
  
  const titleContent = useMemo(() => {
    if (acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES) {
      return (
        <Trans
          ns="upload"
          i18nKey="common.titleReady"
          values={{ count: acceptedFiles.length }}
          components={{ highlight: <span className="text-[#44E3C9]" /> }}
        />
      )
    }
    
    if (selectedFiles.length > 0) {
      return (
        <Trans
          ns="upload"
          i18nKey="common.titleNeedMore"
          values={{ minImages: UPLOAD_CONSTANTS.MIN_IMAGES - acceptedFiles.length, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES - acceptedFiles.length, count: UPLOAD_CONSTANTS.MAX_IMAGES - acceptedFiles.length }}
          components={{ highlight: <span className="text-[#FF973C]" /> }}
        />
      )
    }
    
    return (
      <Trans
        ns="upload"
        i18nKey="common.titleNoImages"
        values={{ minImages: UPLOAD_CONSTANTS.MIN_IMAGES, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES }}
        components={{ highlight: <span className="text-[#FF973C]" /> }}
      />
    )
  }, [acceptedFiles.length, selectedFiles.length, t])

  // 8. Callbacks
  const handleDialogClose = useCallback(() => {
    setUploadState(prev => ({ 
      ...prev, 
      showRejectedDialog: false,
      shownRejectedFiles: [] // Reset the shown files tracking
    }))
    clearRejectedFiles()
  }, [clearRejectedFiles])

  const handleUploadSuccess = useCallback(async (successfulUploads: { url?: string }[]) => {
    try {
      setIsTransitioningToReview(true)
      await updateProgress('review', { 
        uploadedFiles: successfulUploads.map(r => r.url).filter(Boolean),
        lastUploadAt: new Date().toISOString()
      })
      router.push('/app/review')
    } catch (error) {
      toast({
        title: t('status.error'),
        description: t('errors.savingProgress'),
        variant: 'destructive'
      })
      router.push('/app/review')
    }
  }, [updateProgress, router, toast, t])

  const handleUpload = useCallback(async (filesToUpload: FileWithScore[]) => {
    // Filter out existing images from the upload
    const newFilesToUpload = filesToUpload.filter(file => !('isExisting' in file))
    const existingFilesToUpload = filesToUpload.filter(file => 'isExisting' in file)
    
    if (!order && newFilesToUpload.length === 0) {
      // If we only have existing images, we can proceed directly to review
      if (existingFilesToUpload.length > 0) {
        setIsTransitioningToReview(true)
        await handleUploadSuccess(existingFilesToUpload.map(img => ({ url: img.url })))
        return
      }
      
      toast({
        title: t('errors.noActiveOrder'),
        description: t('errors.paymentRequired'),
        variant: 'destructive'
      })
      return
    }

    if (!order) {
      toast({
        title: t('errors.noActiveOrder'),
        description: t('errors.paymentRequired'),
        variant: 'destructive'
      })
      return
    }

    // Initialize uploadedFiles with existing images
    const uploadedFiles: string[] = existingImages?.map(img => img.name).filter((name): name is string => name !== undefined) || []
    let uploadedCount = existingImages?.length || 0
    let currentUploadingIndex: number | null = uploadedCount // Start from after existing images
    const startingUploadingIndex = existingImages?.length || 0
  
    setUploadState(prev => ({ 
      ...prev, 
      uploadedCount: uploadedCount,
      uploadedFiles: uploadedFiles,
      currentUploadingIndex: uploadedCount, // Start with the first new file
      isUploading: true // Set uploading state to true
    }))
    
    const results: { originalName: string; url?: string; error?: string }[] = []

    try {
      // Upload files one by one
      for (let i = 0; i < newFilesToUpload.length; i++) {
        const file = newFilesToUpload[i]
        currentUploadingIndex = startingUploadingIndex + i
        
        // Only one setUploadState per iteration
        setUploadState(prev => ({
          ...prev,
          uploadedFiles: [...uploadedFiles],
          uploadedCount: uploadedCount,
          currentUploadingIndex: currentUploadingIndex,
          isUploading: true
        }))
        
        try {
          const url = await uploadFile(file as File, order.id)
          results.push({ originalName: file.name, url })
          uploadedFiles.push(file.name)
          uploadedCount++
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          results.push({ 
            originalName: file.name, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
        // Add a small delay to make the visual transition more noticeable
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      // After all files, ensure isUploading is false and currentUploadingIndex is null
      setUploadState(prev => ({ 
        ...prev, 
        uploadedFiles: [...uploadedFiles],
        uploadedCount: uploadedCount,
        currentUploadingIndex: null,
        isUploading: false
      }))
      
      const failedUploads = results.filter(r => r.error)
      const successfulUploads = results.filter(r => !r.error)

      // Handle failed uploads
      if (failedUploads.length > 0) {
        toast({
          title: t('errors.uploadFailed'),
          description: t('errors.someUploadsFailed', { count: failedUploads.length }),
          variant: 'destructive'
        })
      }

      // Handle successful uploads
      if (successfulUploads.length > 0 || existingFilesToUpload.length > 0) {
        if (successfulUploads.length > 0) {
          toast({
            title: t('status.successful'),
            description: t('status.uploadComplete', { count: successfulUploads.length })
          })
        }

        // Handle completion - combine successful uploads with existing files
        if (failedUploads.length === 0) {
          const allUploads = [
            ...successfulUploads,
            ...existingFilesToUpload.map(img => ({ url: img.url }))
          ]
          await handleUploadSuccess(allUploads)
        }
      }
    } catch (error) {
      console.error('Upload process error:', error)
      toast({
        title: t('status.failed'),
        description: error instanceof Error ? error.message : t('errors.uploadFailed'),
        variant: 'destructive'
      })
      // Make sure to reset uploading state if there's an error
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        currentUploadingIndex: null
      }))
    }
  }, [order, uploadFile, handleUploadSuccess, toast, t])

  // Confetti timer refs to prevent leaks
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handlePaymentSuccess = () => {
      setShowConfetti(true)
      stopTimerRef.current = setTimeout(() => {
        setShowConfetti('stopping')
        removeTimerRef.current = setTimeout(() => setShowConfetti(false), 15000)
      }, CONFETTI_DURATION)
    }

    paymentEvents.on(PAYMENT_EVENTS.PAYMENT_SUCCESS, handlePaymentSuccess)
    return () => {
      paymentEvents.off(PAYMENT_EVENTS.PAYMENT_SUCCESS, handlePaymentSuccess)
      if (stopTimerRef.current !== null) {
        clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      if (removeTimerRef.current !== null) {
        clearTimeout(removeTimerRef.current)
        removeTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const rejectedFileNames = rejectedFiles.map(f => f.name)
    const hasNewRejectedFiles = rejectedFileNames.length > 0 && (
      // Show dialog if we have any rejected files that haven't been shown yet
      rejectedFileNames.some(name => !uploadState.shownRejectedFiles.includes(name)) ||
      // Or if we have a different set of rejected files than what was previously shown
      uploadState.shownRejectedFiles.some(name => !rejectedFileNames.includes(name))
    )
    
    if (!isAnalyzing && // Only show dialog when analysis is complete
        acceptedFiles.length < UPLOAD_CONSTANTS.MAX_IMAGES && // Only show if we can still add more files
        hasNewRejectedFiles) {
      setUploadState(prev => ({
        ...prev,
        showRejectedDialog: true,
        shownRejectedFiles: rejectedFileNames // Update the list of shown files
      }))
    }
  }, [acceptedFiles.length, rejectedFiles, uploadState.shownRejectedFiles, isAnalyzing])

  // 10. Conditional returns - after all hooks
  if (isLoadingOrder || isVerifying || isLoadingImages) {
    return <UploadPageSkeleton />
  }

  if (orderError) {
    return <div className="text-destructive">{t('status.error')}</div>
  }

  // 11. Final render
  return (
    <div className="text-[#C0CED8] text-center space-y-6 pb-[80px]">
      {(showConfetti === true || showConfetti === 'stopping') && (
        <ReactConfetti
          className='z-52!'
          width={width}
          height={height}
          {...CONFETTI_CONFIG}
          recycle={showConfetti === true} // Only generate new particles when actively showing
          numberOfPieces={showConfetti === 'stopping' ? 0 : CONFETTI_CONFIG.numberOfPieces}
        />
      )}
      
      <div>
        <h2 className="text-[24px] leading-[28px] font-normal tracking-tight">
          {titleContent}
        </h2>
        <p className="font-normal text-[12px] leading-[14px] text-[#C0CED8] mt-2">
          {t('common.description')}
        </p>
      </div>

      <UploadRequirements />
    
      <div className="flex justify-center mt-[32px]">        
        <FileUploader 
          handleNewFiles={handleNewFiles}
          addFiles={addFiles}
          acceptedFiles={acceptedFiles}
          isReady={acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES}
          isAnalyzing={isAnalyzing}
          analyzingCount={analyzingCount}
          isUploading={uploadState.isUploading}
          uploadedCount={uploadState.uploadedCount}
          disabled={uploadState.isUploading || acceptedFiles.length >= UPLOAD_CONSTANTS.MAX_IMAGES}
          currentUploadingIndex={uploadState.currentUploadingIndex}
          uploadedFiles={uploadState.uploadedFiles}
          isTransitioningToReview={isTransitioningToReview}
        />
      </div>

      <RejectedImagesDialog
        open={uploadState.showRejectedDialog}
        onOpenChange={(open) => {
          if (!open && uploadState.showRejectedDialog) {
            handleDialogClose()
          }
        }}
        files={rejectedFiles}
        totalFiles={selectedFiles.length}
        qualityResults={qualityResults}
        onRemoveFile={removeFile}
        onContinue={handleDialogClose}
      />

      <UploadFooter
        acceptedFiles={acceptedFiles}
        minImages={UPLOAD_CONSTANTS.MIN_IMAGES}
        maxImages={UPLOAD_CONSTANTS.MAX_IMAGES}
        onReviewClick={() => handleUpload(acceptedFiles)}
        isUploading={uploadState.isUploading}
        onRemoveFile={removeFile}
        isAnalyzing={isAnalyzing}
        currentAnalyzingIndex={currentFileIndex}
        currentUploadingIndex={uploadState.currentUploadingIndex}
        uploadedFiles={uploadState.uploadedFiles}
      />
    </div>
  )
}