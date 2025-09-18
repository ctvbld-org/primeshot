'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { FileUploader } from '@/components/upload/FileUploader'
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
  const { t } = useTranslation('upload')
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  const [petMode, setPetMode] = useState(false)
  
  // Admin users have different limits
  const isAdmin = authUser?.admin
  const minImages = isAdmin ? 1 : UPLOAD_CONSTANTS.MIN_IMAGES
  const maxImages = isAdmin ? 999 : UPLOAD_CONSTANTS.MAX_IMAGES
  


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
  } = useFileUpload({
    existingImages: existingImagesWithScore,
    onRemoveExistingImage: () => {},
    petMode
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

  // Body shot validation
  const bodyShotValidation = useMemo(() => {
    if (petMode || isAdmin) {
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
  }, [acceptedFiles, qualityResults, petMode, isAdmin])

  // Update parent component when files change
  React.useEffect(() => {
    // Use current quality results since component state is preserved
    onFilesUpdate(acceptedFiles, qualityResults, bodyShotValidation, isAnalyzing)
  }, [acceptedFiles, qualityResults, bodyShotValidation, isAnalyzing, onFilesUpdate])

  const handleDialogClose = useCallback(() => {
    clearRejectedFiles()
  }, [clearRejectedFiles])

  return (
    <>
      {/* Left Column - Upload Area */}
      <div className={styles.uploadLeftColumn}>
        <div className={styles.uploadLeftContent}>
          <div>
            <div className={styles.petModeToggle}>
              <Checkbox checked={petMode} onCheckedChange={(v) => setPetMode(!!v)} id="pet-mode" />
              <label htmlFor="pet-mode">Pet mode</label>
            </div>
            
            {/* Body shot validation errors */}
            {!isAnalyzing && acceptedFiles.length >= minImages && !bodyShotValidation.isValid && (
              <div className={styles.bodyShotError}>
                <div className={styles.bodyShotErrorTitle}>
                  Body Shot Requirements Not Met
                </div>
                <ul className={styles.bodyShotErrorList}>
                  {bodyShotValidation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        
          <div className={styles.uploaderContainer}>        
            <FileUploader 
              handleNewFiles={handleNewFiles}
              addFiles={addFiles}
              acceptedFiles={acceptedFiles}
              isReady={acceptedFiles.length >= minImages}
              isAnalyzing={isAnalyzing}
              analyzingCount={analyzingCount}
              isUploading={false}
              uploadedCount={0}
              disabled={!isAdmin && acceptedFiles.length >= maxImages}
              currentUploadingIndex={null}
              uploadedFiles={[]}
              isTransitioningToReview={false}
            />
          </div>

          <UploadFooter
            acceptedFiles={acceptedFiles}
            minImages={UPLOAD_CONSTANTS.MIN_IMAGES}
            maxImages={isAdmin ? 999 : maxImages}
            onReviewClick={() => {}}
            isUploading={false}
            onRemoveFile={removeFile}
            isAnalyzing={isAnalyzing}
            currentAnalyzingIndex={currentFileIndex}
            currentUploadingIndex={null}
            uploadedFiles={[]}
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
          onRemoveFile={removeFile}
          onContinue={handleDialogClose}
        />
        
        {/* Requirements Section */}
        <RequirementsContent />
      </div>
    </>
  )
}