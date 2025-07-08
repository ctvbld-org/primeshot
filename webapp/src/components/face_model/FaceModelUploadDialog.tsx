'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@primeshot/common/web/ui/dialog'
import { Button } from '@primeshot/common/web/ui/button'
import { useTranslation } from 'react-i18next'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useAuth } from '@/contexts/auth-context'
import { useOpenSigninModal } from '@/hooks/useOpenSigninModal'
import { useFaceModel } from '@/lib/hooks/use-face-model'
import { useJobsApi } from '@/lib/api/jobs'
import { uploadFileInChunks } from '@/lib/upload-utils'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

// Import step components
import { UploadRequirementsStep } from './steps/UploadRequirementsStep'
import { UploadPhotosStep } from './steps/UploadPhotosStep'
import { ProfileFormStep } from './steps/ProfileFormStep'
import { FaceModelNameStep } from './steps/FaceModelNameStep'
import { UploadProgressStep } from './steps/UploadProgressStep'
import { TrainingProgressStep } from './steps/TrainingProgressStep'

interface FaceModelUploadDialogProps {
  onComplete?: (faceModelId: string) => void
}

type DialogStep = 
  | 'requirements' 
  | 'upload' 
  | 'profile' 
  | 'name' 
  | 'uploading' 
  | 'training'

interface StepData {
  uploadedFiles: File[]
  qualityResults: Record<string, { isAcceptable: boolean; score: number }>
  profileData: any
  faceModelName: string
  faceModelId?: string
  trainingJobId?: string
}

const FACE_MODEL_TRAINING_CREDITS = 30

export function FaceModelUploadDialog({ onComplete }: FaceModelUploadDialogProps) {
  const { t } = useTranslation(['upload', 'profile', 'common'])
  const dialogService = useDialogService()
  const { user } = useAuth()
  const { data: subscription } = useCurrentSubscription()
  const creditGuard = useCreditGuard(FACE_MODEL_TRAINING_CREDITS)
  const { startTraining } = useJobsApi()
  
  const [currentStep, setCurrentStep] = useState<DialogStep>('requirements')
  const [stepData, setStepData] = useState<StepData>({
    uploadedFiles: [],
    qualityResults: {},
    profileData: {},
    faceModelName: ''
  })
  const [hasScrolledRequirements, setHasScrolledRequirements] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { 
    createFaceModel,
    updateStatus: updateFaceModelStatus,
    isCreating,
  } = useFaceModel({ autoCreate: false })

  // Calculate if user needs to pay with credits
  const needsCredits = useMemo(() => {
    if (!subscription) return true
    const remainingTrainings = subscription.face_model_training_included - subscription.face_model_training_used
    return remainingTrainings <= 0
  }, [subscription])

  // Handle dialog close
  const handleClose = useCallback(() => {
    // Only allow closing during certain steps
    if (['requirements', 'upload', 'profile', 'name', 'training'].includes(currentStep)) {
      dialogService.closeDialog()
    }
  }, [currentStep, dialogService])

  // Handle step navigation
  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 'requirements':
        if (hasScrolledRequirements) {
          setCurrentStep('upload')
        }
        break
      case 'upload':
        if (stepData.uploadedFiles.length >= 12) {
          setCurrentStep('profile')
        }
        break
      case 'profile':
        setCurrentStep('name')
        break
      case 'name':
        // Process face model creation and upload
        await handleCreateFaceModel()
        break
    }
  }, [currentStep, hasScrolledRequirements, stepData])

  // Upload images helper
  const uploadImages = useCallback(async (files: File[], faceModelId: string) => {
    const uploadedUrls: string[] = []
    let uploadedCount = 0

    for (const file of files) {
      try {
        const fileWithScore = file as any
        fileWithScore.score = stepData.qualityResults[file.name]?.score || 0
        
        const url = await uploadFileInChunks(
          fileWithScore,
          '', // No order ID needed
          faceModelId,
          (progress) => {
            const overallProgress = ((uploadedCount + progress / 100) / files.length) * 100
            setUploadProgress(overallProgress)
          }
        )
        
        uploadedUrls.push(url)
        uploadedCount++
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }
    }

    return uploadedUrls
  }, [stepData.qualityResults])

  // Handle face model creation, payment, and upload
  const handleCreateFaceModel = useCallback(async () => {
    setIsProcessing(true)
    
    try {
      // Create face model with profile data
      const profileData = {
        gender: stepData.profileData.gender,
        ethnicity: stepData.profileData.ethnicity,
        eye_color: stepData.profileData.eyeColor,
        hair_color: stepData.profileData.hairColor,
        hair_length: stepData.profileData.hairLength,
        hair_style: stepData.profileData.hairStyle,
        age_range: stepData.profileData.age,
        body_type: stepData.profileData.bodyType,
        height_range: stepData.profileData.height,
        glasses: stepData.profileData.glasses,
      }

      const faceModel = await createFaceModel(stepData.faceModelName)
      
      if (!faceModel) {
        throw new Error('Failed to create face model')
      }

      // Update face model with profile data
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error: updateError } = await supabase
        .from('face_models')
        .update(profileData)
        .eq('id', faceModel.id)

      if (updateError) {
        console.error('Failed to update face model profile:', updateError)
        // Don't fail the whole process, profile data is secondary
      }

      // Update step data with face model ID
      setStepData((prev: StepData) => ({ ...prev, faceModelId: faceModel.id }))
      
      // Move to upload progress step
      setCurrentStep('uploading')
      
      // Upload images
      const uploadedUrls = await uploadImages(stepData.uploadedFiles, faceModel.id)
      
      if (!uploadedUrls || uploadedUrls.length === 0) {
        throw new Error('Failed to upload images')
      }

      // Update face model status to ready
      await updateFaceModelStatus('ready')

      // Start training
      const trainingResponse = await startTraining({
        face_model_id: faceModel.id,
        user_id: user!.id
      })
      
      if (!trainingResponse?.job_id) {
        throw new Error('Failed to start training')
      }

      // Update step data with training job ID
      setStepData((prev: StepData) => ({ ...prev, trainingJobId: trainingResponse.job_id }))
      
      // Move to training step
      setCurrentStep('training')
      
    } catch (error) {
      console.error('Error creating face model:', error)
      // Handle error appropriately
    } finally {
      setIsProcessing(false)
    }
  }, [stepData, createFaceModel, uploadImages, startTraining, updateFaceModelStatus])

  // Handle training complete
  const handleTrainingComplete = useCallback(() => {
    if (stepData.faceModelId) {
      onComplete?.(stepData.faceModelId)
    }
    dialogService.closeDialog()
  }, [stepData.faceModelId, onComplete, dialogService])

  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case 'requirements':
        return t('upload:requirements.title')
      case 'upload':
        return t('upload:common.title')
      case 'profile':
        return t('profile:title')
      case 'name':
        return t('upload:faceModel.nameTitle')
      case 'uploading':
        return t('upload:status.uploading')
      case 'training':
        return t('upload:faceModel.training')
      default:
        return ''
    }
  }

  // Check if Next button should be disabled
  const isNextDisabled = () => {
    switch (currentStep) {
      case 'requirements':
        return !hasScrolledRequirements
      case 'upload':
        return stepData.uploadedFiles.length < 12
      case 'profile':
        return !stepData.profileData || Object.keys(stepData.profileData).length === 0
      case 'name':
        return !stepData.faceModelName.trim() || isProcessing
      default:
        return false
    }
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <div className="flex items-center gap-2">
            {currentStep !== 'uploading' && (
              <>
                {['requirements', 'upload', 'profile'].includes(currentStep) && (
                  <Button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    variant="default"
                  >
                    {t('common:next')}
                  </Button>
                )}
                {currentStep === 'name' && (
                  <Button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    variant="default"
                  >
                    {needsCredits ? t('upload:faceModel.createWithCredits', { credits: FACE_MODEL_TRAINING_CREDITS }) : t('upload:faceModel.create')}
                  </Button>
                )}
              </>
            )}
            {currentStep === 'training' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {currentStep === 'training' && (
          <div className="text-sm text-muted-foreground px-6">
            {t('upload:faceModel.canClose')}
          </div>
        )}

        <DialogBody className="flex-1 overflow-y-auto">
          {currentStep === 'requirements' && (
            <UploadRequirementsStep
              onScrollToBottom={() => setHasScrolledRequirements(true)}
            />
          )}
          
          {currentStep === 'upload' && (
            <UploadPhotosStep
              onFilesUpdate={(files, qualityResults) => {
                setStepData(prev => ({ ...prev, uploadedFiles: files, qualityResults }))
              }}
            />
          )}
          
          {currentStep === 'profile' && (
            <ProfileFormStep
              onProfileUpdate={(data) => {
                setStepData(prev => ({ ...prev, profileData: data }))
              }}
            />
          )}
          
          {currentStep === 'name' && (
            <FaceModelNameStep
              thumbnail={stepData.uploadedFiles[0]}
              value={stepData.faceModelName}
              onChange={(name) => setStepData(prev => ({ ...prev, faceModelName: name }))}
              needsCredits={needsCredits}
              credits={FACE_MODEL_TRAINING_CREDITS}
            />
          )}
          
          {currentStep === 'uploading' && (
            <UploadProgressStep
              progress={uploadProgress}
              totalFiles={stepData.uploadedFiles.length}
            />
          )}
          
          {currentStep === 'training' && stepData.faceModelId && stepData.trainingJobId && (
            <TrainingProgressStep
              faceModelId={stepData.faceModelId}
              trainingJobId={stepData.trainingJobId}
              onComplete={handleTrainingComplete}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

// Export function to open the dialog
export function openFaceModelUploadDialog() {
  const dialogService = useDialogService()
  const openSigninModal = useOpenSigninModal()
  
  // We'll need to access these inside the actual component
  // This is just the trigger function
  dialogService.openDialog({
    id: 'face-model-upload',
    component: FaceModelUploadDialog,
    props: {}
  })
}