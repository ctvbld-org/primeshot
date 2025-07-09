'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { FileUploader } from '@/components/upload/file-uploader'
import { RejectedImagesDialog } from '@/components/upload/rejected-images-dialog'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { UploadFooter } from '@/components/upload/upload-footer'

interface UploadPhotosStepProps {
  onFilesUpdate: (files: File[], qualityResults: Record<string, { isAcceptable: boolean; score: number }>) => void
}

export function UploadPhotosStep({ onFilesUpdate }: UploadPhotosStepProps) {
  const { t } = useTranslation('upload')
  const { toast } = useToast()
  
  const [uploadState, setUploadState] = useState({
    showRejectedDialog: false,
    shownRejectedFiles: [] as string[],
  })

  const {
    files: selectedFiles,
    qualityResults,
    addFiles,
    removeFile,
    clearRejectedFiles,
    handleNewFiles,
    isAnalyzing,
    analyzingCount,
    currentFileIndex,
  } = useFileUpload({
    existingImages: [],
    onRemoveExistingImage: () => {}
  })
  
  const acceptedFiles = useMemo(() => {
    return selectedFiles
      .filter(file => qualityResults[file.name]?.isAcceptable)
      .map(file => Object.assign(file, {
        score: Math.round(qualityResults[file.name]?.score || 0)
      }));
  }, [selectedFiles, qualityResults])

  const rejectedFiles = useMemo(() => 
    selectedFiles
      .filter(file => !qualityResults[file.name]?.isAcceptable)
      .map(file => Object.assign(file, {
        score: Math.round(qualityResults[file.name]?.score || 0)
      })),
    [selectedFiles, qualityResults]
  )

  // Update parent component when files change
  React.useEffect(() => {
    onFilesUpdate(acceptedFiles, qualityResults)
  }, [acceptedFiles, qualityResults, onFilesUpdate])

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
          values={{ 
            minImages: UPLOAD_CONSTANTS.MIN_IMAGES - acceptedFiles.length, 
            maxImages: UPLOAD_CONSTANTS.MAX_IMAGES - acceptedFiles.length, 
            count: UPLOAD_CONSTANTS.MAX_IMAGES - acceptedFiles.length 
          }}
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

  const handleDialogClose = useCallback(() => {
    setUploadState(prev => ({ 
      ...prev, 
      showRejectedDialog: false,
      shownRejectedFiles: []
    }))
    clearRejectedFiles()
  }, [clearRejectedFiles])

  React.useEffect(() => {
    const rejectedFileNames = rejectedFiles.map(f => f.name)
    const hasNewRejectedFiles = rejectedFileNames.length > 0 && (
      rejectedFileNames.some(name => !uploadState.shownRejectedFiles.includes(name)) ||
      uploadState.shownRejectedFiles.some(name => !rejectedFileNames.includes(name))
    )
    
    if (!isAnalyzing && acceptedFiles.length < UPLOAD_CONSTANTS.MAX_IMAGES && hasNewRejectedFiles) {
      setUploadState(prev => ({
        ...prev,
        showRejectedDialog: true,
        shownRejectedFiles: rejectedFileNames
      }))
    }
  }, [acceptedFiles.length, rejectedFiles, uploadState.shownRejectedFiles, isAnalyzing])

  return (
    <div className="text-[#C0CED8] text-center space-y-6">
      <div>
        <h2 className="text-[24px] leading-[28px] font-normal tracking-tight">
          {titleContent}
        </h2>
        <p className="font-normal text-[12px] leading-[14px] text-[#C0CED8] mt-2">
          {t('common.description')}
        </p>
      </div>
    
      <div className="flex justify-center mt-[32px]">        
        <FileUploader 
          handleNewFiles={handleNewFiles}
          addFiles={addFiles}
          acceptedFiles={acceptedFiles}
          isReady={acceptedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES}
          isAnalyzing={isAnalyzing}
          analyzingCount={analyzingCount}
          isUploading={false}
          uploadedCount={0}
          disabled={acceptedFiles.length >= UPLOAD_CONSTANTS.MAX_IMAGES}
          currentUploadingIndex={null}
          uploadedFiles={[]}
          isTransitioningToReview={false}
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
        onReviewClick={() => {}}
        isUploading={false}
        onRemoveFile={removeFile}
        isAnalyzing={isAnalyzing}
        currentAnalyzingIndex={currentFileIndex}
        currentUploadingIndex={null}
        uploadedFiles={[]}
      />
    </div>
  )
}