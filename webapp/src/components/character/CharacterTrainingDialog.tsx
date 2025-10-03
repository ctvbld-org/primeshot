'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogTitle, DialogDescription } from '@primeshot/common/web/ui/dialog'
import { Button, buttonVariants } from '@primeshot/common/web/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
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
import styles from './CharacterTrainingDialog.module.css'

// Import step components
import { UploadPhotosStep } from './training/UploadPhotosStep'
import { CharacterNameStep } from './training/CharacterNameStep'
import { UploadProgressStep } from './training/UploadProgressStep'
import { TrainingProgressStep } from './training/TrainingProgressStep'
import OnboardingStep from './training/OnboardingStep'
import dynamic from 'next/dynamic'

// Code-split admin dialog so it is not bundled for non-admins
const AdminTrainingOptionsDialog = dynamic(() => import('./training/AdminTrainingOptionsDialog'), { ssr: false })

interface CharacterTrainingDialogProps {
  onComplete?: (characterId: string) => void
  // Hint for DialogServiceProvider to not wrap this component in its own Dialog
  wrapWithDialog?: boolean
}

type DialogStep = 
  | 'onboarding-intro'
  | 'onboarding-guidelines'
  | 'onboarding-confirmation'
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
    gradient_accumulation_steps: number
    resize_size: number
    learning_rate: number
    resolution: number[]
    rank: number
    optimizer: 'adamw' | 'adamw8bit'
  }
  // Onboarding state
  onboardingStep?: number
  onboardingGuidelines?: Array<{
    id: string
    title: string
    description: string
    icon: string
    images: Array<{ src: string; alt: string }>
  }>
}

export function CharacterTrainingDialog({ onComplete }: CharacterTrainingDialogProps) {
  const { t } = useTranslation(['character', 'common'])
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
  
  // Start with onboarding intro step
  const [currentStep, setCurrentStep] = useState<DialogStep>('onboarding-intro')
  const [stepData, setStepData] = useState<StepData>({
    uploadedFiles: [],
    qualityResults: {},
    characterName: '',
    onboardingStep: 0,
    onboardingGuidelines: [
      {
        id: 'natural-light',
        title: t('character:onboarding.guidelines.naturalLight.title'),
        description: t('character:onboarding.guidelines.naturalLight.description'),
        icon: 'sun',
        images: [
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/natural-light-2-w320.webp', alt: t('character:onboarding.guidelines.naturalLight.goodAlt') },
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/natural-light-1-w320.webp', alt: t('character:onboarding.guidelines.naturalLight.badAlt') }
        ]
      },
      {
        id: 'angles',
        title: t('character:onboarding.guidelines.angles.title'),
        description: t('character:onboarding.guidelines.angles.description'),
        icon: 'angles',
        images: [
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/angles-1-w320.webp', alt: t('character:onboarding.guidelines.angles.goodAlt') },
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/angles-2-w320.webp', alt: t('character:onboarding.guidelines.angles.badAlt') }
        ]
      },
      {
        id: 'expressions',
        title: t('character:onboarding.guidelines.expressions.title'),
        description: t('character:onboarding.guidelines.expressions.description'),
        icon: 'smilyFace',
        images: [
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/expression-2-w320.webp', alt: t('character:onboarding.guidelines.expressions.goodAlt') },
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/expression-1-w320.webp', alt: t('character:onboarding.guidelines.expressions.badAlt') }
        ]
      },
      {
        id: 'variety',
        title: t('character:onboarding.guidelines.variety.title'),
        description: t('character:onboarding.guidelines.variety.description'),
        icon: 'variety',
        images: [
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/variety-1-w320.webp', alt: t('character:onboarding.guidelines.variety.goodAlt') },
          { src: 'https://d3el9qajjnmn76.cloudfront.net/app-images/character-onboarding/variety-2-w320.webp', alt: t('character:onboarding.guidelines.variety.badAlt') }
        ]
      }
    ]
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

  // Admin users have different limits
  const isAdmin = user?.admin
  const minImages = UPLOAD_CONSTANTS.MIN_IMAGES

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
      case 'onboarding-intro':
      case 'onboarding-guidelines':
      case 'onboarding-confirmation':
        return false // Onboarding steps can be skipped without confirmation
      default:
        return false
    }
  }, [currentStep, stepData])

  // Add beforeunload event listener for browser window close protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInCriticalStep) {
        e.preventDefault()
        e.returnValue = t('character:beforeUnloadWarning')
        return t('character:beforeUnloadWarning')
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
      title: t('character:trainingError'),
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
    } else if (currentStep.startsWith('onboarding')) {
      // Allow closing during onboarding steps
      dialogService.closeDialog()
    }
  }, [currentStep, stepData.trainingJobId, isInCriticalStep, needsCloseConfirmation, dialogService])

  // Prevent dialog from closing via overlay click or escape key during critical steps
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      handleClose() // This will now handle confirmation logic
    }
  }, [handleClose])

  // Handle files update from upload step
  const handleFilesUpdate = useCallback((files: File[], qualityResults: Record<string, ImageQualityResult>, bodyShotValidation: { isValid: boolean; errors: string[] }, isAnalyzing: boolean) => {
    setStepData(prev => {
      // Only update if files, qualityResults, bodyShotValidation, or isAnalyzing have actually changed
      const filesChanged = prev.uploadedFiles.length !== files.length ||
        prev.uploadedFiles.some((f, i) => f.name !== files[i]?.name) ||
        files.some((f, i) => f.name !== prev.uploadedFiles[i]?.name);
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
  }, [])

  // Handle step navigation
  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 'onboarding-intro':
        setCurrentStep('onboarding-guidelines')
        setStepData(prev => ({ ...prev, onboardingStep: 0 }))
        break
      case 'onboarding-guidelines':
        const currentGuidelineIndex = stepData.onboardingStep || 0
        const nextIndex = currentGuidelineIndex + 1

        if (nextIndex < (stepData.onboardingGuidelines?.length || 0)) {
          setStepData(prev => ({ ...prev, onboardingStep: nextIndex }))
        } else {
          setCurrentStep('onboarding-confirmation')
        }
        break
      case 'onboarding-confirmation':
        setCurrentStep('upload')
        break
      case 'upload':
        {
          const acceptedCount = Object.values(stepData.qualityResults || {}).filter(r => r?.isAcceptable).length
          if (acceptedCount >= minImages && stepData.bodyShotValidation?.isValid && !stepData.isAnalyzing) {
            setCurrentStep('name')
          }
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
  }, [currentStep, stepData, minImages])

  // Handle back navigation
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'onboarding-guidelines': {
        const idx = stepData.onboardingStep || 0
        if (idx > 0) setStepData(prev => ({ ...prev, onboardingStep: idx - 1 }))
        else setCurrentStep('onboarding-intro')
        break
      }
      case 'onboarding-confirmation': {
        const lastGuidelineIndex = (stepData.onboardingGuidelines?.length || 1) - 1
        setCurrentStep('onboarding-guidelines')
        setStepData(prev => ({ ...prev, onboardingStep: lastGuidelineIndex }))
        break
      }
      case 'upload':
        setCurrentStep('onboarding-confirmation')
        break
      case 'name':
        setCurrentStep('upload')
        break
    }
  }, [currentStep, stepData.onboardingGuidelines, stepData.onboardingStep])

  // Check if back button should be shown
  const canGoBack = useMemo(() => {
    if (currentStep === 'onboarding-guidelines') {
      return true
    }
    if (currentStep === 'onboarding-confirmation') {
      return true
    }
    return ['upload', 'name'].includes(currentStep)
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
        return t('character:confirmClose.progressMessages.upload')
      case 'name':
        return t('character:confirmClose.progressMessages.name')
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
  const handleCreateCharacter = useCallback(async (overrideParams?: { batch_size: number; resize_size: number; steps: number; learning_rate: number; resolution: number[]; rank?: number; optimizer?: 'adamw' | 'adamw8bit'; gradient_accumulation_steps?: number }) => {
    setIsProcessing(true)
    let createdCharacterId: string | undefined
    
    try {
      // Validate character limit BEFORE creating the character
      if (!subscription) {
        throw new Error('Active subscription required for character training')
      }

      if (!isAdmin) {
        // Get current character count using the centralized method
        const currentCharacterCount = await getActiveCharacterCount(user!.id)

        // Prefer API-provided limit; fallback to tiers if missing
        const maxCharacters = (subscription as any)?.max_characters ?? (subscriptionTiers?.find(tier => tier.name === subscription.plan_name)?.max_characters || 1)
        
        if (currentCharacterCount >= maxCharacters) {
          const planLabel = (subscription as any)?.plan_display_name || subscription.plan_name
          throw new Error(`Character limit reached. Your ${planLabel} plan allows ${maxCharacters} character(s).`)
        }
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
          }
        } catch (cleanupError) {
          console.error('Error during character cleanup:', cleanupError)
        }
      }
      
      // Show error toast and close dialog
      let errorMessage = error instanceof Error ? error.message : t('character:trainingFailed')
      let errorTitle = t('character:trainingError')
      
      // Check if this was a final retry failure
      if (retryState && retryState.attempt >= retryState.maxRetries) {
        errorTitle = t('character:errors.trainingRetryFailed', { attempts: retryState.maxRetries })
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
  }, [stepData, createCharacter, uploadImages, startTraining, updateCharacterStatus, onComplete, subscription, subscriptionTiers, user, toast, t, dialogService, isAdmin])



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
      case 'onboarding-intro':
        return t('character:dialogTitles.onboardingIntro')
      case 'onboarding-guidelines':
        return t('character:dialogTitles.onboardingGuidelines')
      case 'onboarding-confirmation':
        return t('character:dialogTitles.onboardingConfirmation')
      case 'upload':
        return t('character:dialogTitles.upload')
      case 'name':
        return t('character:dialogTitles.name')
      case 'uploading':
        return t('character:dialogTitles.uploading')
      case 'training':
        return t('character:dialogTitles.training')
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
      case 'onboarding-intro':
      case 'onboarding-guidelines':
      case 'onboarding-confirmation':
        return false
      case 'upload':
        return (
          stepData.uploadedFiles.length < minImages ||
          stepData.isAnalyzing ||
          (!stepData.bodyShotValidation?.isValid)
        )
      case 'name':
        return !stepData.characterName.trim() || isProcessing
      default:
        return false
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent fullscreen className={styles.dialogContent}>
        {/* Hidden DialogTitle for accessibility */}
        <DialogTitle className={styles.srOnly}>{getDialogTitle()}</DialogTitle>
        <DialogDescription className={styles.srOnly}>
          {currentStep === 'upload' ? t('character:dialogDescription.upload') : 
           currentStep === 'name' ? t('character:dialogDescription.name') : 
           currentStep === 'training' ? t('character:dialogDescription.training') : 
           t('character:dialogDescription.default')}
        </DialogDescription>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={handleBack}
                className={styles.iconButtonSmall}
              >
                <Icon variant="arrowLeft" className={styles.iconSmall} />
              </Button>
            )}
          </div>
          <div className={styles.headerRight}>
            {/* Upload step actions: Cancel + Next */}
            {currentStep === 'upload' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  disabled={isNextDisabled()}
                >
                  {t('common:next')}
                </Button>
              </>
            )}
            {canGoBack && currentStep !== 'upload' && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={handleClose}
                className={styles.iconButtonSmall}
              >
                <Icon variant="cross" className={styles.iconSmall} />
              </Button>
            )}
          </div>
        </div>

        <DialogBody className={styles.dialogBody}>
          {/* Unified Onboarding Step */}
          {(currentStep === 'onboarding-intro' || currentStep === 'onboarding-guidelines' || currentStep === 'onboarding-confirmation') && (
            <div className={styles.stepCentered}>
              <OnboardingStep
                step={currentStep as any}
                guidelineIndex={stepData.onboardingStep || 0}
                guidelines={stepData.onboardingGuidelines || []}
                onNext={handleNext}
                onBack={() => {
                  // inline to respect updated onboarding back rules
                  if (currentStep === 'onboarding-confirmation') {
                    const lastGuidelineIndex = (stepData.onboardingGuidelines?.length || 1) - 1
                    setCurrentStep('onboarding-guidelines')
                    setStepData(prev => ({ ...prev, onboardingStep: lastGuidelineIndex }))
                    return
                  }
                  if (currentStep === 'onboarding-guidelines') {
                    const idx = stepData.onboardingStep || 0
                    if (idx > 0) {
                      setStepData(prev => ({ ...prev, onboardingStep: idx - 1 }))
                    } else {
                      setCurrentStep('onboarding-intro')
                    }
                    return
                  }
                }}
                onSkip={() => setCurrentStep('upload')}
                onFinish={() => setCurrentStep('upload')}
              />
            </div>
          )}

          {/* Upload Photos Step - Always rendered, hidden when not active */}
          <div className={ cn(currentStep === 'upload' ? styles.stepVisible : styles.stepHidden, styles.stepUploadPhotos)}>
            <UploadPhotosStep
              onFilesUpdate={handleFilesUpdate}
            />
          </div>

          {/* Character Name Step - Always rendered, hidden when not active */}
          <div className={currentStep === 'name' ? styles.stepCentered : styles.stepHidden}>
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
          <div className={currentStep === 'uploading' ? styles.stepCentered : styles.stepHidden}>
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
            <div className={currentStep === 'training' ? styles.stepCentered : styles.stepHidden}>
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
      <ConfirmDialog
        open={showCloseConfirmation}
        onOpenChange={setShowCloseConfirmation}
        title={t('character:confirmClose.title')}
        description={(t('character:confirmClose.description'))}
        confirmText={t('character:confirmClose.buttons.confirm')}
        cancelText={t('character:confirmClose.buttons.cancel')}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        iconVariant="warning"
        confirmVariant="destructive"
      />
    </Dialog>
  )
}