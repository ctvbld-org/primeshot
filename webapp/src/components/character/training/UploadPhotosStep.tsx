'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { FileUploader, type FileUploaderHandle } from '@/components/upload/FileUploader'
import { useAuth } from '@/contexts/auth-context'

import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { Checkbox } from '@primeshot/common/web/ui/checkbox'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { UploadFooter } from '@/components/upload/UploadFooter'
import { ImageQualityResult, checkBodyShotRequirements } from '@/lib/image-quality'
import { RequirementsContent } from '@/components/upload/RequirementsContent'
import { RejectedImagesContent } from '@/components/upload/RejectedImagesContent'
import type { FileWithScore } from '@/lib/types'
import styles from '../CharacterTrainingDialog.module.css'

interface UploadPhotosStepProps {
  onFilesUpdate: (files: File[], qualityResults: Record<string, ImageQualityResult>, bodyShotValidation: { isValid: boolean; errors: string[] }, isAnalyzing: boolean) => void
  // existingFiles and existingQualityResults no longer needed due to hidden/visible approach
}



export function UploadPhotosStep({ onFilesUpdate }: UploadPhotosStepProps) {
  const { t } = useTranslation('character')
  const { user: authUser } = useAuth()
  const [petMode, setPetMode] = useState(false)
  const [bodyRequirementBypassed, setBodyRequirementBypassed] = useState(false)
  
  // Admin users have different limits
  const isAdmin = authUser?.admin
  const minImages = UPLOAD_CONSTANTS.MIN_IMAGES
  const maxImages = isAdmin ? 999 : UPLOAD_CONSTANTS.MAX_IMAGES
  
  const fileUploaderRef = React.useRef<FileUploaderHandle>(null)


  // Convert existing files to FileWithScore format
  // Since we're now using hidden/visible approach instead of conditional rendering,
  // the component state is preserved and we don't need existing files restoration
  const existingImagesWithScore = useMemo((): FileWithScore[] => {
    // With the new hidden/visible approach, component state is preserved
    // so we don't need to restore files from props anymore
    return [];
  }, [])

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
    canBypassQuality,
    rejectedCount,
    batchFilteredCount,
    totalBatchImages,
    bypassQualityChecks,
    triggerAnalysis
  } = useFileUpload({
    existingImages: existingImagesWithScore,
    onRemoveExistingImage: () => {},
    petMode
  })
  
  const acceptedFiles = useMemo(() => {
    return selectedFiles
      .filter(file => qualityResults[file.name]?.isAcceptable)
      .map(file => {
        const result = qualityResults[file.name];
        return Object.assign(file, {
          score: Math.round(result?.score || 0),
          bokehScore: result?.bokehScore,
          brightnessScore: result?.brightnessScore,
          contrastScore: result?.contrastScore,
          saturationScore: result?.saturationScore,
          blurScore: result?.blurScore
        });
      });
  }, [selectedFiles, qualityResults])

  const rejectedFiles = useMemo(() => 
    selectedFiles
      .filter(file => !qualityResults[file.name]?.isAcceptable)
      .map(file => Object.assign(file, {
        score: Math.round(qualityResults[file.name]?.score || 0)
      })),
    [selectedFiles, qualityResults]
  )

  const removeFileByFileRef = useCallback((file: FileWithScore | File) => {
    // Prefer strict reference match to avoid duplicate-name edge cases
    let fsIndex = selectedFiles.findIndex(f => f === (file as File))
    if (fsIndex === -1) {
      // Fallback to name + lastModified
      fsIndex = selectedFiles.findIndex(f => f.name === file.name && (f as File).lastModified === (file as File).lastModified)
    }
    if (fsIndex === -1) {
      // Final fallback: first by name only
      fsIndex = selectedFiles.findIndex(f => f.name === file.name)
    }
    if (fsIndex !== -1) removeFile(fsIndex)
  }, [selectedFiles, removeFile])

  // Handler for bypassing body shot requirement
  const handleBypassBodyShotRequirement = useCallback(async () => {
    setBodyRequirementBypassed(true)
    // Trigger Claude analysis now that body shot requirement is bypassed
    await triggerAnalysis()
  }, [triggerAnalysis])

  // Body shot validation
  const bodyShotValidation = useMemo(() => {
    if (petMode || bodyRequirementBypassed) {
      return { isValid: true, errors: [] as string[] };
    }
    // Use only current quality results since component state is preserved
    const acceptedQualityResults = Object.fromEntries(
      acceptedFiles.map(file => [file.name, qualityResults[file.name]])
    );
    const validation = checkBodyShotRequirements(acceptedQualityResults);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }, [acceptedFiles, qualityResults, petMode, bodyRequirementBypassed])

  // Update parent component when files change (trigger on selectedFiles too)
  React.useEffect(() => {
    onFilesUpdate(acceptedFiles, qualityResults, bodyShotValidation, isAnalyzing)
  }, [selectedFiles.length, acceptedFiles.length, qualityResults, bodyShotValidation, isAnalyzing, onFilesUpdate])

  const handleDialogClose = useCallback(() => {
    clearRejectedFiles()
  }, [clearRejectedFiles])

  // Shared drag handlers for both FileUploader and UploadFooter
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const disabled = !isAdmin && acceptedFiles.length >= maxImages
    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    const filesToAdd = handleNewFiles(droppedFiles)
    if (filesToAdd.length > 0) {
      await addFiles(filesToAdd)
    }
  }, [handleNewFiles, addFiles, isAdmin, acceptedFiles.length, maxImages])

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const disabled = !isAdmin && acceptedFiles.length >= maxImages
    if (!disabled) {
      setIsDragging(true)
    }
  }, [isAdmin, acceptedFiles.length, maxImages])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  return (
    <>
      {/* Left Column - Upload Area */}
      <div className={styles.uploadLeftColumn}>
        <div className={styles.uploadLeftContent}>
          <div>
            <div className={styles.petModeToggle}>
              <Checkbox checked={petMode} onCheckedChange={(v) => setPetMode(!!v)} id="pet-mode" />
              <label htmlFor="pet-mode">{t('uploadStep.petMode')}</label>
            </div>
          </div>
        
          <div className={styles.uploaderContainer}>        
            <FileUploader 
              ref={fileUploaderRef}
              handleNewFiles={handleNewFiles}
              addFiles={addFiles}
              acceptedFiles={acceptedFiles}
              minImages={minImages}
              maxImages={maxImages}
              isReady={acceptedFiles.length >= minImages}
              isAnalyzing={isAnalyzing}
              analyzingCount={analyzingCount}
              isUploading={false}
              uploadedCount={0}
              disabled={!isAdmin && acceptedFiles.length >= maxImages}
              currentUploadingIndex={null}
              uploadedFiles={[]}
              isTransitioningToReview={false}
              bodyShotValidation={{
                isValid: bodyShotValidation.isValid,
                errors: bodyShotValidation.errors,
                // Build i18nErrors again so FileUploader can localize
                i18nErrors: (!bodyShotValidation.isValid && !bodyRequirementBypassed ? ((): any[] => {
                  const acceptedQualityResults = Object.fromEntries(
                    acceptedFiles.map(file => [file.name, qualityResults[file.name]])
                  )
                  const validation = checkBodyShotRequirements(acceptedQualityResults)
                  return validation.i18nErrors as any
                })() : [])
              }}
              onBypassBodyShotRequirement={handleBypassBodyShotRequirement}
              bodyRequirementBypassed={bodyRequirementBypassed}
              batchFilteredCount={batchFilteredCount}
              totalBatchImages={totalBatchImages}
            />
          </div>

          <UploadFooter
            acceptedFiles={acceptedFiles}
            minImages={UPLOAD_CONSTANTS.MIN_IMAGES}
            maxImages={isAdmin ? 999 : maxImages}
            onReviewClick={() => {}}
            isUploading={false}
            onRemoveFile={(index) => removeFileByFileRef(acceptedFiles[index])}
            isAnalyzing={isAnalyzing}
            currentAnalyzingIndex={currentFileIndex}
            currentUploadingIndex={null}
            uploadedFiles={[]}
            onEmptySquareClick={() => fileUploaderRef.current?.openFileDialog()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={!isAdmin && acceptedFiles.length >= maxImages}
          />
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className={styles.sidebar}>
        {/* Rejected Images Section - shown when there are rejected files */}
        <RejectedImagesContent
          files={rejectedFiles}
          totalFiles={selectedFiles.length}
          qualityResults={qualityResults}
          onRemoveFile={(index) => removeFileByFileRef(rejectedFiles[index])}
          onContinue={handleDialogClose}
          canBypassQuality={canBypassQuality}
          rejectedCount={rejectedCount}
          onBypassQuality={bypassQualityChecks}
        />
        
        {/* Requirements Section */}
        <RequirementsContent />
      </div>
    </>
  )
}