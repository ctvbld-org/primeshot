'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@/components/ui/use-toast'
import dynamic from 'next/dynamic'
import { useWindowSize } from '@/lib/hooks/use-window-size'

import { FileUploader } from '@/components/upload/file-uploader'
import { UploadRequirements } from '@/components/upload/upload-requirements'
import { UploadFooter } from '@/components/upload/upload-footer'

import { useUserProgress } from '@/lib/hooks/use-user-progress'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { useOrder } from '@/lib/hooks/use-order'
import { cn } from '@/lib/utils'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'

// Import Confetti dynamically to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

// Easy toggle for confetti animation
const SHOW_CONFETTI = true

export default function UploadPage() {
  const { width, height } = useWindowSize()
  const { t } = useTranslation('upload')
  const router = useRouter()
  const { toast } = useToast()
  const { updateProgress } = useUserProgress()
  const [, setUploadedCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState<boolean | 'stopping'>(false)

  // Custom hooks for managing state
  const { order, styles, isLoading, error } = useOrder()
  const {
    files: selectedFiles,
    qualityResults,
    isUploading,
    addFiles,
    uploadFile,
    removeFile
  } = useFileUpload({ maxFiles: UPLOAD_CONSTANTS.MAX_IMAGES })

  // Show confetti when we have enough accepted files
  useEffect(() => {
    if (SHOW_CONFETTI && selectedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES) {
      setShowConfetti(true)
      // Stop generating new confetti after 3 seconds, but let existing pieces fall
      const stopNewConfetti = setTimeout(() => {
        setShowConfetti('stopping')
      }, 3000)
      // Remove component after all pieces have likely fallen (8 seconds total)
      const removeConfetti = setTimeout(() => {
        setShowConfetti(false)
      }, 8000)
      return () => {
        clearTimeout(stopNewConfetti)
        clearTimeout(removeConfetti)
      }
    }
  }, [selectedFiles.length])

  // Filter accepted images
  const acceptedFiles = selectedFiles.filter(file => 
    qualityResults[file.name]?.isAcceptable
  )

  // Handle upload with streaming response
  const handleUpload = async (filesToUpload: File[]) => {
    if (!order || filesToUpload.length === 0) {
      toast({
        title: t('errors.noActiveOrder'),
        description: t('errors.paymentRequired'),
        variant: 'destructive'
      })
      return
    }

    setUploadedCount(0)
    const results: { originalName: string; url?: string; error?: string }[] = []

    try {
      // Upload files one by one
      for (const file of filesToUpload) {
        try {
          const url = await uploadFile(file, order.id)
          results.push({ originalName: file.name, url })
          setUploadedCount(prev => prev + 1)
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

      if (failedUploads.length > 0) {
         toast({
          title: t('errors.someUploadsFailed'),
          description: t('errors.uploadFailed', { count: failedUploads.length }),
          variant: 'destructive'
        })
      }
      if (successfulUploads.length > 0) {
         toast({
          title: t('success.uploadComplete'),
          description: t('status.successful', { count: successfulUploads.length })
        })
      }
      
      // Remove successfully uploaded files from the list
      const successfulFileNames = new Set(successfulUploads.map(r => r.originalName))
      const indicesToRemove = selectedFiles
        .map((file, index) => successfulFileNames.has(file.name) ? index : -1)
        .filter(index => index !== -1)
        .sort((a, b) => b - a)
      
      indicesToRemove.forEach(index => removeFile(index))

      // Save Progress and Navigate if fully successful
      if (failedUploads.length === 0 && successfulUploads.length > 0) {
         try {
            await updateProgress('review', { 
                uploadedFiles: successfulUploads.map(r => r.url).filter(Boolean),
                lastUploadAt: new Date().toISOString()
            })
            router.push('/app/review') 
          } catch (progressError) {
            toast({
               title: t('status.error'),
               description: t('errors.savingProgress'),
               variant: 'destructive' 
            })
            router.push('/app/review')
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
  }

  if (isLoading) {
    return <div className="text-muted-foreground">{t('status.processing')}</div>
  }

  if (error) {
    return <div className="text-destructive">{t('status.error')}</div>
  }

  return (
    <div className="text-[#C0CED8] text-center space-y-6 pb-[80px]">
      {SHOW_CONFETTI && showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={showConfetti === true}
          gravity={0.2}
          initialVelocityY={10}
          colors={['#44E3C9', '#FF973C', '#C0CED8']}
        />
      )}
      <div>
        <h2 className="text-[24px] leading-[28px] font-normal tracking-tight">
          {selectedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES ? (
            <Trans
              ns="upload"
              i18nKey="common.titleReady"
              values={{ count: selectedFiles.length }}
              components={{ highlight: <span className="text-[#44E3C9]" /> }}
            />
          ) : (
            <Trans
              ns="upload"
              i18nKey="common.titleNeedMore"
              values={{ minImages: UPLOAD_CONSTANTS.MIN_IMAGES, maxImages: UPLOAD_CONSTANTS.MAX_IMAGES }}
              components={{ highlight: <span className="text-[#FF973C]" /> }}
            />
          )}
        </h2>
        <p className="font-normal text-[12px] leading-[14px] text-[#C0CED8] mt-2">{t('common.description')}</p>
      </div>

      <UploadRequirements />
    
      <div className="mt-[32px]">
        <FileUploader onFilesAdded={addFiles} />
      </div>

      <UploadFooter
        acceptedFiles={acceptedFiles}
        minImages={UPLOAD_CONSTANTS.MIN_IMAGES}
        maxImages={UPLOAD_CONSTANTS.MAX_IMAGES}
        onReviewClick={() => handleUpload(acceptedFiles)}
        isUploading={isUploading}
        onRemoveFile={removeFile}
        qualityResults={qualityResults}
      />
    </div>
  )
}