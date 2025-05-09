'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@/components/ui/use-toast'
import dynamic from 'next/dynamic'
import { useWindowSize } from '@/lib/hooks/use-window-size'
import { cn } from '@/lib/utils'

import { FileUploader } from '@/components/upload/file-uploader'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { UploadFooter } from '@/components/upload/upload-footer'
import { RejectedImagesDialog } from '@/components/upload/rejected-images-dialog'

import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useOrder } from '@/lib/hooks/use-order'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { Loader } from '@/components/ui/loader'

// Import Confetti dynamically to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

// Constants
const SHOW_CONFETTI = true
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
  const { t } = useTranslation('upload')
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const { order, isLoading, error } = useOrder()
  
  // 2. State hooks
  const [uploadState, setUploadState] = useState({
    uploadedCount: 0,
    showConfetti: false as boolean | 'stopping',
    hasShownConfetti: false,
    showRejectedDialog: false,
    shownRejectedFiles: [] as string[]
  })

  // 3. Custom hooks
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
  } = useFileUpload()

  // 4. Memoized values
  const acceptedFiles = useMemo(() => 
    selectedFiles.filter(file => qualityResults[file.name]?.isAcceptable),
    [selectedFiles, qualityResults]
  )

  const rejectedFiles = useMemo(() => 
    selectedFiles.filter(file => !qualityResults[file.name]?.isAcceptable),
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

  // 5. Callbacks
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

  const handleUpload = useCallback(async (filesToUpload: File[]) => {
    if (!order || filesToUpload.length === 0) {
      toast({
        title: t('errors.noActiveOrder'),
        description: t('errors.paymentRequired'),
        variant: 'destructive'
      })
      return
    }

    setUploadState(prev => ({ ...prev, uploadedCount: 0 }))
    const results: { originalName: string; url?: string; error?: string }[] = []

    try {
      // Upload files one by one
      for (const file of filesToUpload) {
        try {
          const url = await uploadFile(file, order.id)
          results.push({ originalName: file.name, url })
          setUploadState(prev => ({ ...prev, uploadedCount: prev.uploadedCount + 1 }))
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          results.push({ 
            originalName: file.name, 
            error: error instanceof Error ? error.message : 'Upload failed' 
          })
        }
      }
      
      const failedUploads = results.filter(r => r.error)
      const successfulUploads = results.filter(r => !r.error)

      // Handle failed uploads
      if (failedUploads.length > 0) {
        toast({
          title: t('errors.someUploadsFailed'),
          description: t('errors.uploadFailed', { count: failedUploads.length }),
          variant: 'destructive'
        })
      }

      // Handle successful uploads
      if (successfulUploads.length > 0) {
        toast({
          title: t('status.successful'),
          description: t('status.uploadComplete', { count: successfulUploads.length })
        })

        // Remove successfully uploaded files
        const successfulFileNames = new Set(successfulUploads.map(r => r.originalName))
        selectedFiles
          .map((file, index) => successfulFileNames.has(file.name) ? index : -1)
          .filter(index => index !== -1)
          .sort((a, b) => b - a)
          .forEach(removeFile)

        // Handle completion
        if (failedUploads.length === 0) {
          await handleUploadSuccess(successfulUploads)
        }
      }
    } catch (error) {
      console.error('Upload process error:', error)
      toast({
        title: t('status.failed'),
        description: error instanceof Error ? error.message : t('errors.uploadFailed'),
        variant: 'destructive'
      })
    }
  }, [order, uploadFile, removeFile, handleUploadSuccess, toast, t, selectedFiles])

  // 6. Effects - always after all other hooks
  useEffect(() => {
    if (!SHOW_CONFETTI || uploadState.hasShownConfetti || 
        acceptedFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES) {
      return
    }

    setUploadState(prev => ({ ...prev, hasShownConfetti: true, showConfetti: true }))
    
    const timer = setTimeout(() => {
      setUploadState(prev => ({ ...prev, showConfetti: false }))
    }, CONFETTI_DURATION)

    return () => clearTimeout(timer)
  }, [uploadState.hasShownConfetti, acceptedFiles.length])

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

  // 7. Conditional returns - after all hooks
  if (isLoading) {
    return <div className="text-muted-foreground">{t('status.processing')}</div>
  }

  if (error) {
    return <div className="text-destructive">{t('status.error')}</div>
  }

  // 8. Final render
  return (
    <div className="text-[#C0CED8] text-center space-y-6 pb-[80px]">
      {SHOW_CONFETTI && uploadState.showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          {...CONFETTI_CONFIG}
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
    
      <div className={cn(
        "mt-[32px] relative transition-opacity duration-300"
      )}>
        {isUploading && (
          <div className="flex flex-col items-center bg-[rgba(255,151,60,0.07)] backdrop-blur-sm gap-6 rounded-[16px] absolute top-1/2 left-1/2 transform-[translate3d(-50%,-50%,0)] z-10 py-10 px-6">
            <Loader className="w-6 h-6" />
            <p className="text-[16px] text-[#C0CED8]">
              {t('status.uploadingProgress', {
                current: uploadState.uploadedCount + 1,
                total: acceptedFiles.length
              })}
            </p>
          </div>
        )}
        
        <FileUploader 
          handleNewFiles={handleNewFiles}
          addFiles={addFiles}
          acceptedFiles={acceptedFiles}
          isReady={acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES}
          isAnalyzing={isAnalyzing}
          analyzingCount={analyzingCount}
          disabled={isUploading || acceptedFiles.length >= UPLOAD_CONSTANTS.MAX_IMAGES}
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
        isUploading={isUploading}
        onRemoveFile={removeFile}
        qualityResults={qualityResults}
        isAnalyzing={isAnalyzing}
        currentAnalyzingIndex={currentFileIndex}
      />
    </div>
  )
}