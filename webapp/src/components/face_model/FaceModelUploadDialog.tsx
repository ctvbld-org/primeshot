'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@primeshot/common/web/ui/dialog'
import { Button, buttonVariants } from '@primeshot/common/web/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@primeshot/common/web/ui/alert-dialog'
import { useTranslation } from 'react-i18next'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useAuth } from '@/contexts/auth-context'
import { useFaceModel } from '@/lib/hooks/use-face-model'
import { useJobsApi } from '@/lib/api/jobs'
import { uploadFileInChunks } from '@/lib/upload-utils'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Icon } from '@primeshot/common/web/Icon'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { ImageQualityResult } from '@/lib/image-quality'
import { useCreditCosts, getFaceModelTrainingCost, useSubscriptionTiers } from '@/hooks/usePricingConfig'

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
  qualityResults: Record<string, ImageQualityResult>
  profileData: any
  faceModelName: string
  faceModelId?: string
  trainingJobId?: string
}

const REQUIREMENTS_SEEN_KEY = 'face-model-requirements-seen'

export function FaceModelUploadDialog({ onComplete }: FaceModelUploadDialogProps) {
  const { t } = useTranslation(['upload', 'profile', 'common'])
  const dialogService = useDialogService()
  const { user } = useAuth()
  const { data: subscription } = useCurrentSubscription()
  const { data: creditCosts } = useCreditCosts()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  
  // Get face model training cost from DB
  const faceModelTrainingCost = getFaceModelTrainingCost(creditCosts)
  const creditGuard = useCreditGuard(faceModelTrainingCost)
  const { startTraining } = useJobsApi()
  
  // Check if user has seen requirements before and set initial step
  const getInitialStep = (): DialogStep => {
    if (typeof window !== 'undefined') {
      const hasSeenRequirements = localStorage.getItem(REQUIREMENTS_SEEN_KEY) === 'true'
      return hasSeenRequirements ? 'upload' : 'requirements'
    }
    return 'requirements'
  }
  
  const [currentStep, setCurrentStep] = useState<DialogStep>(getInitialStep())
  const [stepData, setStepData] = useState<StepData>({
    uploadedFiles: [],
    qualityResults: {},
    profileData: {},
    faceModelName: ''
  })
  const [hasScrolledRequirements, setHasScrolledRequirements] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProfileComplete, setIsProfileComplete] = useState(false)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)

  const { 
    createFaceModel,
    updateStatus: updateFaceModelStatus,
    isCreating,
  } = useFaceModel({ autoCreate: false })

  // Check if we're in a critical step where closing should be prevented
  const isInCriticalStep = useMemo(() => {
    return ['uploading'].includes(currentStep) || (currentStep === 'training' && !stepData.trainingJobId)
  }, [currentStep, stepData.trainingJobId])

  // Check if we need to show confirmation modal when closing
  const needsCloseConfirmation = useMemo(() => {
    switch (currentStep) {
      case 'upload':
        return stepData.uploadedFiles.length > 0
      case 'profile':
        return Object.keys(stepData.profileData).length > 0
      case 'name':
        return stepData.faceModelName.trim().length > 0
      default:
        return false
    }
  }, [currentStep, stepData])

  // Add beforeunload event listener for browser window close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInCriticalStep) {
        e.preventDefault()
        e.returnValue = 'Your face model is currently being processed. Are you sure you want to leave? This will cancel the upload.'
        return 'Your face model is currently being processed. Are you sure you want to leave? This will cancel the upload.'
      }
    }

    if (isInCriticalStep) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isInCriticalStep])

  // Calculate if user needs to pay with credits
  const needsCredits = useMemo(() => {
    if (!subscription) return true
    const remainingTrainings = subscription.face_model_training_included - subscription.face_model_training_used
    return remainingTrainings <= 0
  }, [subscription])

  // Check if user has sufficient credits when needed
  const hasSufficientCredits = useMemo(() => {
    if (!subscription || !needsCredits) return true
    const remainingCredits = subscription.credits_included - subscription.credits_used_this_period
    return remainingCredits >= faceModelTrainingCost
  }, [subscription, needsCredits, faceModelTrainingCost])

  // Check subscription validity
  const subscriptionStatus = useMemo(() => {
    if (!subscription) {
      return { isValid: false, error: 'noActiveSubscription' }
    }
    
    if (needsCredits && !hasSufficientCredits) {
      return { 
        isValid: false, 
        error: 'insufficientCredits',
        credits: faceModelTrainingCost 
      }
    }
    
    return { isValid: true }
  }, [subscription, needsCredits, hasSufficientCredits, faceModelTrainingCost])

  // Handle dialog close - only allow during specific steps
  const handleClose = useCallback(() => {
    // Prevent closing during critical steps
    if (isInCriticalStep) {
      return
    }
    
    // Show confirmation if there's progress to lose
    if (needsCloseConfirmation) {
      setShowCloseConfirmation(true)
      return
    }
    
    // Direct close for requirements step or when no progress
    if (['requirements', 'upload', 'profile', 'name'].includes(currentStep)) {
      dialogService.closeDialog()
    } else if (currentStep === 'training' && stepData.trainingJobId) {
      // Allow closing during training only if training has started
      dialogService.closeDialog()
    }
  }, [currentStep, stepData.trainingJobId, isInCriticalStep, needsCloseConfirmation, dialogService])

  // Prevent dialog from closing via overlay click or escape key during critical steps
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleClose() // This will now handle confirmation logic
    }
  }, [handleClose])

  // Handle step navigation
  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 'requirements':
        if (hasScrolledRequirements) {
          setCurrentStep('upload')
        }
        break
      case 'upload':
        if (stepData.uploadedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES) {
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

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('requirements')
        break
      case 'profile':
        setCurrentStep('upload')
        break
      case 'name':
        setCurrentStep('profile')
        break
    }
  }, [currentStep])

  // Check if back button should be shown
  const canGoBack = useMemo(() => {
    return ['upload', 'profile', 'name'].includes(currentStep)
  }, [currentStep])

  // Handle confirmation modal actions
  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirmation(false)
    dialogService.closeDialog()
  }, [dialogService])

  const handleCancelClose = useCallback(() => {
    setShowCloseConfirmation(false)
  }, [])

  // Get specific progress message for confirmation modal
  const getProgressMessage = useCallback(() => {
    switch (currentStep) {
      case 'upload':
        return t('upload:confirmClose.progressMessages.upload')
      case 'profile':
        return t('upload:confirmClose.progressMessages.profile')
      case 'name':
        return t('upload:confirmClose.progressMessages.name')
      default:
        return ''
    }
  }, [currentStep, t])

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
    let createdFaceModelId: string | undefined
    
    try {
      // Validate face model limit BEFORE creating the face model
      if (!subscription) {
        throw new Error('Active subscription required for face model training')
      }

      // Get current face model count
      const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
      const supabaseClient = createSupabaseClient()
      
      const { data: userFaceModels, error: faceModelsError } = await supabaseClient
        .from('face_models')
        .select('id')
        .eq('user_id', user!.id)

      if (faceModelsError) {
        console.error('Failed to check user face models:', faceModelsError)
        throw new Error('Failed to validate face model limits')
      }

      // Get face model limit from subscription tiers data
      const maxFaceModels = subscriptionTiers?.find(tier => tier.name === subscription.plan_name)?.max_face_models || 1
      
      console.log(`Face model limit check: ${userFaceModels.length} existing models, limit is ${maxFaceModels} for plan ${subscription.plan_name}`)
      
      if (userFaceModels.length >= maxFaceModels) {
        throw new Error(`Face model limit reached. Your ${subscription.plan_name} plan allows ${maxFaceModels} face model(s).`)
      }

      // Create face model with profile data
      const rawProfileData = {
        gender: stepData.profileData.gender,
        ethnicity: stepData.profileData.ethnicity,
        eye_color: stepData.profileData.eyeColor,
        hair_color: stepData.profileData.hairColor,
        
        age_range: stepData.profileData.age,
        body_type: stepData.profileData.bodyType,
        height_range: stepData.profileData.height,
        glasses: stepData.profileData.glasses,
      }
      
      // Filter out empty/undefined values to avoid constraint violations
      const profileData = Object.entries(rawProfileData).reduce((acc, [key, value]) => {
        if (value && value.trim && value.trim() !== '') {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)

      const faceModel = await createFaceModel(stepData.faceModelName)
      
      if (!faceModel) {
        throw new Error('Failed to create face model')
      }

      createdFaceModelId = faceModel.id
      console.log(`Created face model: ${createdFaceModelId}`)

      // Update face model with profile data
      const { error: updateError } = await supabaseClient
        .from('face_models')
        .update(profileData)
        .eq('id', faceModel.id)

      if (updateError) {
        console.error('Failed to update face model profile:', updateError)
        throw new Error(`Failed to update face model profile: ${updateError.message}`)
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

      // Face model remains in 'queued' status until the training job updates it

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
      
      // Notify parent immediately so selector updates
      onComplete?.(faceModel.id)

      // Move to training step
      setCurrentStep('training')
      
    } catch (error) {
      console.error('Error creating face model:', error)
      
      // Cleanup: If we created a face model but something failed afterwards, clean it up
      if (createdFaceModelId) {
        console.log(`Cleaning up failed face model: ${createdFaceModelId}`)
        try {
          // Call cleanup API endpoint
          const response = await fetch('/api/cleanup-face-model', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              faceModelId: createdFaceModelId,
            }),
          })

          if (!response.ok) {
            console.error('Failed to cleanup face model:', await response.text())
          } else {
            console.log('Successfully cleaned up face model')
          }
        } catch (cleanupError) {
          console.error('Error during face model cleanup:', cleanupError)
        }
      }
      
      // Show error to user and reset to name step
      setCurrentStep('name')
      // You may want to show a toast or error message here
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [stepData, createFaceModel, uploadImages, startTraining, updateFaceModelStatus, onComplete, subscription, subscriptionTiers, user])

  // Handle profile data updates
  const handleProfileUpdate = useCallback((data: any, isComplete: boolean) => {
    setStepData(prev => ({ ...prev, profileData: data }))
    setIsProfileComplete(isComplete)
  }, [])

  // Handle training complete
  const handleTrainingComplete = useCallback(() => {
    if (stepData.faceModelId) {
      onComplete?.(stepData.faceModelId)
    }
    dialogService.closeDialog()
  }, [stepData.faceModelId, onComplete, dialogService])

  // Get the first accepted file's image analysis result for auto-population
  const getImageAnalysisForAutoPopulation = useCallback(() => {
    if (!stepData.uploadedFiles.length || !stepData.qualityResults) {
      return undefined
    }
    
    // Find the first accepted file's analysis result
    const firstFile = stepData.uploadedFiles.find(file => 
      stepData.qualityResults[file.name]?.isAcceptable
    )
    
    return firstFile ? stepData.qualityResults[firstFile.name] : undefined
  }, [stepData.uploadedFiles, stepData.qualityResults])

  // Handle requirements scroll and save to localStorage
  const handleRequirementsScrolled = useCallback(() => {
    setHasScrolledRequirements(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(REQUIREMENTS_SEEN_KEY, 'true')
    }
  }, [])

  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case 'requirements':
        return 'Requirements'
      case 'upload':
        return 'Upload Photos'
      case 'profile':
        return 'Profile Information'
      case 'name':
        return 'Name Your Face Model'
      case 'uploading':
        return 'Uploading Photos'
      case 'training':
        return 'Training Model'
      default:
        return ''
    }
  }

  // Check if Next button should be disabled
  const isNextDisabled = () => {
    // Always check subscription status first
    if (!subscriptionStatus.isValid) {
      return true
    }

    switch (currentStep) {
      case 'requirements':
        return !hasScrolledRequirements
      case 'upload':
        return stepData.uploadedFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES
      case 'profile':
        return !isProfileComplete
      case 'name':
        return !stepData.faceModelName.trim() || isProcessing
      default:
        return false
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <Icon variant="arrowLeft" className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {currentStep !== 'uploading' && (
              <>
                {['requirements', 'upload', 'profile'].includes(currentStep) && (
                  <Button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    variant="primary"
                  >
                    {t('common:next')}
                  </Button>
                )}
                {currentStep === 'name' && (
                  <Button
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                    variant="primary"
                  >
                    {needsCredits ? `Create with ${faceModelTrainingCost} Credits` : 'Create'}
                  </Button>
                )}
              </>
            )}
            {currentStep === 'training' && stepData.trainingJobId && (
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
            {'You can close this dialog while training runs in the background.'}
          </div>
        )}

        {/* Critical Step Warning */}
        {isInCriticalStep && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mx-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="text-amber-800 text-sm font-medium">
                ⚠️ Please don't close this window - your face model is being processed
              </div>
            </div>
          </div>
        )}

        {/* Subscription Error Display */}
        {!subscriptionStatus.isValid && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mx-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="text-destructive text-sm font-medium">
                {subscriptionStatus.error === 'noActiveSubscription' && t('errors.noActiveSubscription')}
                {subscriptionStatus.error === 'insufficientCredits' && 
                  t('errors.creditPackRequired', { credits: subscriptionStatus.credits })}
              </div>
            </div>
          </div>
        )}

        <DialogBody className="flex-1 overflow-y-auto">
          {currentStep === 'requirements' && (
            <UploadRequirementsStep
              onScrollToBottom={handleRequirementsScrolled}
            />
          )}
          
          {currentStep === 'upload' && (
            <UploadPhotosStep
              onFilesUpdate={(files, qualityResults) => {
                setStepData(prev => {
                  // Only update if files or qualityResults have actually changed
                  const filesChanged = prev.uploadedFiles.length !== files.length ||
                    prev.uploadedFiles.some((f, i) => f.name !== files[i].name);
                  const qualityChanged = JSON.stringify(prev.qualityResults) !== JSON.stringify(qualityResults);
                  if (!filesChanged && !qualityChanged) return prev;
                  return { ...prev, uploadedFiles: files, qualityResults };
                });
              }}
            />
          )}
          
          {currentStep === 'profile' && (
            <ProfileFormStep
              onProfileUpdate={handleProfileUpdate}
              imageAnalysisResult={getImageAnalysisForAutoPopulation()}
              enableAutoPopulation={true}
            />
          )}
          
          {currentStep === 'name' && (
            <FaceModelNameStep
              thumbnail={stepData.uploadedFiles[0]}
              value={stepData.faceModelName}
              onChange={(name) => setStepData(prev => ({ ...prev, faceModelName: name }))}
              needsCredits={needsCredits}
              credits={faceModelTrainingCost}
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

      {/* Confirmation Modal */}
      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('upload:confirmClose.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('upload:confirmClose.description')}
              {needsCloseConfirmation && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {getProgressMessage()}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              {t('upload:confirmClose.buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmClose} 
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t('upload:confirmClose.buttons.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}