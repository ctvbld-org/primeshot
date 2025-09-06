'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogDescription } from '@primeshot/common/web/ui/dialog'
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
import { useToast } from '@primeshot/common/web/ui/use-toast'
import { useCreditGuard } from '@/hooks/useCreditGuard'
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription'
import { useAuth } from '@/contexts/auth-context'
import { useCharacter } from '@/lib/hooks/use-character'
import { useCharactersApi } from '@/lib/api/characters'
import { useJobsApi } from '@/lib/api/jobs'
import { uploadFileInChunks } from '@/lib/upload-utils'
import { cn } from '@/lib/utils'

import { Icon } from '@primeshot/common/web/Icon'
import { UPLOAD_CONSTANTS } from '@/lib/constants/upload'
import { ImageQualityResult } from '@/lib/image-quality'
import { useCreditCosts, getCharacterTrainingCost, useSubscriptionTiers } from '@/hooks/usePricingConfig'
import { useCreditBalance } from '@/hooks/useCreditBalance'
import { getApiUrl } from '@/lib/api/client'

// Import step components
import { UploadPhotosStep } from './training/UploadPhotosStep'
import { CharacterNameStep } from './training/CharacterNameStep'
import { UploadProgressStep } from './training/UploadProgressStep'
import { TrainingProgressStep } from './training/TrainingProgressStep'
import dynamic from 'next/dynamic'

// Code-split admin dialog so it is not bundled for non-admins
const AdminTrainingOptionsDialog = dynamic(() => import('./training/AdminTrainingOptionsDialog'), { ssr: false })

interface CharacterTrainingDialogProps {
  onComplete?: (characterId: string) => void
  // Hint for DialogServiceProvider to not wrap this component in its own Dialog
  wrapWithDialog?: boolean
}

type DialogStep = 
  | 'upload' 
  | 'name' 
  | 'uploading' 
  | 'training'

interface StepData {
  uploadedFiles: File[]
  qualityResults: Record<string, ImageQualityResult>
  characterName: string
  characterId?: string
  trainingJobId?: string
  bodyShotValidation?: { isValid: boolean; errors: string[] }
  isAnalyzing?: boolean
  adminTrainingParams?: {
    steps: number
    batch_size: number
    resize_size: number
    rank: number
  }
}

export function CharacterTrainingDialog({ onComplete }: CharacterTrainingDialogProps) {
  const { t } = useTranslation(['upload', 'profile', 'common'])
  const { toast } = useToast()
  const dialogService = useDialogService()
  const { user } = useAuth()
  const { data: subscription } = useCurrentSubscription()
  const { data: creditCosts } = useCreditCosts()
  const { data: subscriptionTiers } = useSubscriptionTiers()
  const { data: creditBalance } = useCreditBalance()
  
  // Get character training cost from DB
  const characterTrainingCost = getCharacterTrainingCost(creditCosts)
  const creditGuard = useCreditGuard(characterTrainingCost)
  const { startTraining } = useJobsApi()
  
  // Start directly at upload step since requirements are now integrated
  const [currentStep, setCurrentStep] = useState<DialogStep>('upload')
  const [stepData, setStepData] = useState<StepData>({
    uploadedFiles: [],
    qualityResults: {},
    characterName: ''
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileCount, setUploadedFileCount] = useState(0)
  const [currentUploadingFile, setCurrentUploadingFile] = useState<File | null>(null)

  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [retryState, setRetryState] = useState<{ attempt: number; maxRetries: number; error?: Error } | null>(null)
  const [showAdminOptions, setShowAdminOptions] = useState(false)

  const { 
    createCharacter,
    updateStatus: updateCharacterStatus,
    isCreating,
  } = useCharacter({ autoCreate: false })

  const { getActiveCharacterCount } = useCharactersApi()

  // Check if we're in a critical step where closing should be prevented
  const isInCriticalStep = useMemo(() => {
    return ['uploading'].includes(currentStep) || (currentStep === 'training' && !stepData.trainingJobId)
  }, [currentStep, stepData.trainingJobId])

  // Check if we need to show confirmation modal when closing
  const needsCloseConfirmation = useMemo(() => {
    switch (currentStep) {
      case 'upload':
        return stepData.uploadedFiles.length > 0
      case 'name':
        return stepData.uploadedFiles.length > 0 || stepData.characterName.trim().length > 0
      default:
        return false
    }
  }, [currentStep, stepData])

  // Add beforeunload event listener for browser window close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInCriticalStep) {
        e.preventDefault()
        e.returnValue = 'Your character is currently being processed. Are you sure you want to leave? This will cancel the upload.'
        return 'Your character is currently being processed. Are you sure you want to leave? This will cancel the upload.'
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
    const remainingTrainings = subscription.character_training_included - subscription.character_training_used
    return remainingTrainings <= 0
  }, [subscription])

  // Check if user has sufficient credits when needed
  const hasSufficientCredits = useMemo(() => {
    if (!needsCredits) return true
    if (creditBalance === undefined) return false
    return creditBalance >= characterTrainingCost
  }, [needsCredits, creditBalance, characterTrainingCost])

  // Check subscription validity
  const subscriptionStatus = useMemo(() => {
    if (!subscription) {
      return { isValid: false, error: 'noActiveSubscription' }
    }
    
    if (needsCredits && !hasSufficientCredits) {
      return { 
        isValid: false, 
        error: 'insufficientCredits',
        credits: characterTrainingCost 
      }
    }
    
    return { isValid: true }
  }, [subscription, needsCredits, hasSufficientCredits, characterTrainingCost])

  // Handle training error - show toast and close dialog
  const handleTrainingError = useCallback((error: string) => {
    toast({
      title: t('upload:character.trainingError'),
      description: error,
      variant: 'destructive'
    })
    dialogService.closeDialog()
  }, [toast, t, dialogService])

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
    
    // Direct close for upload/name step or when no progress
    if (['upload', 'name'].includes(currentStep)) {
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
      case 'upload':
        if (stepData.uploadedFiles.length >= UPLOAD_CONSTANTS.MIN_IMAGES) {
          setCurrentStep('name')
        }
        break
      case 'name':
        // If admin, open admin training options first
        if (user?.admin) {
          setShowAdminOptions(true)
        } else {
          await handleCreateCharacter()
        }
        break
    }
  }, [currentStep, stepData])

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'name':
        setCurrentStep('upload')
        break
    }
  }, [currentStep])

  // Check if back button should be shown
  const canGoBack = useMemo(() => {
    return ['name'].includes(currentStep)
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
      case 'name':
        return t('upload:confirmClose.progressMessages.name')
      default:
        return ''
    }
  }, [currentStep, t])

  // Upload images helper
  const uploadImages = useCallback(async (files: File[], characterId: string) => {
    const uploadedUrls: string[] = []
    let uploadedCount = 0

    // Reset upload progress and count
    setUploadProgress(0)
    setUploadedFileCount(0)

    for (const file of files) {
      try {
        // Set current uploading file
        setCurrentUploadingFile(file)
        
        const fileWithScore = file as any
        fileWithScore.score = stepData.qualityResults[file.name]?.score || 0
        // Attach normalized face box hint for server-side thumbnail crop
        fileWithScore.faceBox = stepData.qualityResults[file.name]?.faceBox
        // Mark the first file so server generates thumbnail only once
        fileWithScore.isFirstImage = uploadedCount === 0
        
        const url = await uploadFileInChunks(
          fileWithScore,
          characterId,
          (progress) => {
            // Calculate progress for current file (0-100)
            const currentFileProgress = progress / 100
            // Calculate overall progress: (completed files + current file progress) / total files
            const overallProgress = ((uploadedCount + currentFileProgress) / files.length) * 100
            setUploadProgress(Math.min(100, overallProgress))
          }
        )
        
        uploadedUrls.push(url)
        uploadedCount++
        setUploadedFileCount(uploadedCount)
        
        // Update progress to reflect completed file
        const overallProgress = (uploadedCount / files.length) * 100
        setUploadProgress(Math.min(100, overallProgress))
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }
    }

    // Clear current uploading file when done
    setCurrentUploadingFile(null)
    return uploadedUrls
  }, [stepData.qualityResults])

  // Handle character creation, payment, and upload
  const handleCreateCharacter = useCallback(async (overrideParams?: { batch_size: number; resize_size: number; rank: number; steps: number }) => {
    setIsProcessing(true)
    let createdCharacterId: string | undefined
    
    try {
      // Validate character limit BEFORE creating the character
      if (!subscription) {
        throw new Error('Active subscription required for character training')
      }

      // Get current character count using the centralized method
      const currentCharacterCount = await getActiveCharacterCount(user!.id)

      // Get character limit from subscription tiers data
      const maxCharacters = subscriptionTiers?.find(tier => tier.name === subscription.plan_name)?.max_characters || 1
      
      if (currentCharacterCount >= maxCharacters) {
        throw new Error(`Character limit reached. Your ${subscription.plan_name} plan allows ${maxCharacters} character(s).`)
      }

      // Profile data will now be automatically generated during training

      const character = await createCharacter(stepData.characterName)
      
      if (!character) {
        throw new Error('Failed to create character')
      }

      createdCharacterId = character.id

      // Update step data with character ID
      setStepData((prev: StepData) => ({ ...prev, characterId: character.id }))
      
      // Move to upload progress step
      setCurrentStep('uploading')
      
      // Upload images
      const uploadedUrls = await uploadImages(stepData.uploadedFiles, character.id)
      
      if (!uploadedUrls || uploadedUrls.length === 0) {
        throw new Error('Failed to upload images')
      }

      // Start training with retry mechanism
      const trainingResponse = await startTraining({
        character_id: character.id,
        user_id: user!.id,
        // Include admin params only if defined
        training_params: overrideParams ?? stepData.adminTrainingParams
      }, (attempt, maxRetries, error) => {
        console.log(`Training API retry ${attempt}/${maxRetries}:`, error.message)
        setRetryState({ attempt, maxRetries, error })
      })
      
      if (!trainingResponse?.job_id) {
        throw new Error('Failed to start training')
      }

      // Clear retry state on success
      setRetryState(null)
      
      // Update step data with training job ID
      setStepData((prev: StepData) => ({ ...prev, trainingJobId: trainingResponse.job_id }))
      
      // Notify parent immediately so selector updates
      onComplete?.(character.id)

      // Move to training step
      setCurrentStep('training')
      
    } catch (error) {
      console.error('Error creating character:', error)
      
      // Clear retry state on final error
      setRetryState(null)
      
      // Cleanup: If we created a character but something failed afterwards, clean it up
      if (createdCharacterId) {
        console.log(`Cleaning up failed character: ${createdCharacterId}`)
        try {
          // Call cleanup API endpoint
          const response = await fetch(getApiUrl('api/cleanup-character'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              characterId: createdCharacterId,
            }),
          })

          if (!response.ok) {
            console.error('Failed to cleanup character:', await response.text())
          } else {
            console.log('Successfully cleaned up character')
          }
        } catch (cleanupError) {
          console.error('Error during character cleanup:', cleanupError)
        }
      }
      
      // Show error toast and close dialog
      let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during character creation'
      let errorTitle = t('upload:character.trainingError')
      
      // Check if this was a final retry failure
      if (retryState && retryState.attempt >= retryState.maxRetries) {
        errorTitle = t('upload:errors.trainingRetryFailed', { attempts: retryState.maxRetries })
        errorMessage = retryState.error?.message || errorMessage
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      })
      
      // Close dialog on error
      dialogService.closeDialog()
      return
    } finally {
      setIsProcessing(false)
    }
  }, [stepData, createCharacter, uploadImages, startTraining, updateCharacterStatus, onComplete, subscription, subscriptionTiers, user, toast, t, dialogService])



  // Handle training complete
  const handleTrainingComplete = useCallback(() => {
    if (stepData.characterId) {
      onComplete?.(stepData.characterId)
    }
    dialogService.closeDialog()
  }, [stepData.characterId, onComplete, dialogService])





  // Get dialog title based on current step
  const getDialogTitle = () => {
    switch (currentStep) {
      case 'upload':
        return 'Upload Photos'
      case 'name':
        return 'Name Your Character'
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
      case 'upload':
        return (
          stepData.uploadedFiles.length < UPLOAD_CONSTANTS.MIN_IMAGES ||
          stepData.isAnalyzing ||
          !stepData.bodyShotValidation?.isValid
        )
      case 'name':
        return !stepData.characterName.trim() || isProcessing
      default:
        return false
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent fullscreen className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col !p-0">
        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">{getDialogTitle()}</DialogTitle>
        <DialogDescription className="sr-only">
          {currentStep === 'upload' ? 'Upload photos to create your character' : 
           currentStep === 'name' ? 'Name your character' : 
           currentStep === 'training' ? 'Character training in progress' : 
           'Character creation dialog'}
        </DialogDescription>
        <div className="flex flex-row items-center justify-between px-6 py-4 min-h-[64px]">
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
          </div>
          <div className="flex items-center gap-2">
            {/* Cancel Button - only show for upload and name steps */}
            {(currentStep === 'upload' || currentStep === 'name') && (
              <Button
                variant="outline"
                onClick={handleClose}
              >
                {t('common:cancel')}
              </Button>
            )}
            
            {/* Next Button - only show for upload step */}
            {currentStep === 'upload' && (
              <Button
                onClick={handleNext}
                disabled={isNextDisabled()}
                variant="primary"
              >
                {t('common:next')}
              </Button>
            )}
          </div>
        </div>

        <DialogBody className="flex-1 overflow-y-auto">
          {/* Upload Photos Step - Always rendered, hidden when not active */}
          <div className={currentStep === 'upload' ? 'flex h-full overflow-hidden' : 'hidden'}>
            <UploadPhotosStep
              onFilesUpdate={(files, qualityResults, bodyShotValidation, isAnalyzing) => {
                setStepData(prev => {
                  // Only update if files, qualityResults, bodyShotValidation, or isAnalyzing have actually changed
                  const filesChanged = prev.uploadedFiles.length !== files.length ||
                    prev.uploadedFiles.some((f, i) => f.name !== files[i].name);
                  const qualityChanged = JSON.stringify(prev.qualityResults) !== JSON.stringify(qualityResults);
                  const bodyShotChanged = JSON.stringify(prev.bodyShotValidation) !== JSON.stringify(bodyShotValidation);
                  const analyzingChanged = prev.isAnalyzing !== isAnalyzing;
                  
                  if (!filesChanged && !qualityChanged && !bodyShotChanged && !analyzingChanged) return prev;
                  return { 
                    ...prev, 
                    uploadedFiles: files, 
                    qualityResults, 
                    bodyShotValidation, 
                    isAnalyzing 
                  };
                });
              }}
            />
          </div>

          {/* Character Name Step - Always rendered, hidden when not active */}
          <div className={currentStep === 'name' ? 'flex h-full items-center justify-center' : 'hidden'}>
            <CharacterNameStep
              thumbnail={stepData.uploadedFiles[0]}
              value={stepData.characterName}
              onChange={(name) => setStepData(prev => ({ ...prev, characterName: name }))}
              needsCredits={needsCredits}
              credits={characterTrainingCost}
              onCreateClick={handleNext}
              disabled={isNextDisabled()}
              remainingTrainings={subscription?.character_training_included ? subscription.character_training_included - subscription.character_training_used : undefined}
              totalTrainings={subscription?.character_training_included}
              usedTrainings={subscription?.character_training_used}
            />
          </div>
          
          {/* Upload Progress Step - Always rendered, hidden when not active */}
          <div className={currentStep === 'uploading' ? 'flex h-full items-center justify-center' : 'hidden'}>
            <UploadProgressStep
              progress={uploadProgress}
              totalFiles={stepData.uploadedFiles.length}
              uploadedFileCount={uploadedFileCount}
              retryState={retryState}
              currentUploadingFile={currentUploadingFile}
              uploadedFiles={stepData.uploadedFiles}
            />
          </div>
          
          {/* Training Progress Step - Conditionally rendered since it needs IDs */}
          {stepData.characterId && stepData.trainingJobId && (
            <div className={currentStep === 'training' ? 'flex h-full items-center justify-center' : 'hidden'}>
              <TrainingProgressStep
                characterId={stepData.characterId}
                trainingJobId={stepData.trainingJobId}
                onComplete={handleTrainingComplete}
                onError={handleTrainingError}
              />
            </div>
          )}
        </DialogBody>
      </DialogContent>

      {/* Admin Options Dialog - only rendered for admins */}
      {user?.admin && (
        <AdminTrainingOptionsDialog
          open={showAdminOptions}
          onCancel={() => setShowAdminOptions(false)}
          onConfirm={(params) => {
            setShowAdminOptions(false)
            setStepData(prev => ({ ...prev, adminTrainingParams: params }))
            // proceed to create with these params
            handleCreateCharacter(params)
          }}
        />
      )}

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