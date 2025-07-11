'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { ProgressTracker } from '../progress_tracker'
import { Countdown } from '../countdown'

interface TrainingProgressStepProps {
  faceModelId: string
  trainingJobId: string
  onComplete?: () => void
}

interface TrainingProgressState {
  progress?: any
  isConnected: boolean
  isConnecting: boolean
  error?: string | null
  getProgressPercentage?: () => number
  getEstimatedTimeRemaining?: () => string
  getLiveCountdownSeconds?: () => number
}

export function TrainingProgressStep({ 
  faceModelId, 
  trainingJobId,
  onComplete 
}: TrainingProgressStepProps) {
  const { t } = useTranslation('upload')
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgressState>({
    isConnected: false,
    isConnecting: true,
  })
  const [showError, setShowError] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)

  // Start a timer after mount or when job/model changes
  useEffect(() => {
    setHasSettled(false)
    const timer = setTimeout(() => setHasSettled(true), 1000)
    return () => clearTimeout(timer)
  }, [faceModelId, trainingJobId])

  // Handler for progress updates
  const handleProgressUpdate = useCallback((modelId: string, data: TrainingProgressState) => {
    setTrainingProgress(data)
  }, [])

  // Handler for training completion
  const handleTrainingComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // Debounce error display: only show if not connecting, not connected, error exists, and hasSettled
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined
    if (
      hasSettled &&
      trainingProgress.error &&
      !trainingProgress.isConnecting &&
      !trainingProgress.isConnected
    ) {
      timeout = setTimeout(() => setShowError(true), 500)
    } else {
      setShowError(false)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [hasSettled, trainingProgress.error, trainingProgress.isConnecting, trainingProgress.isConnected])

  const progressPercentage = trainingProgress.getProgressPercentage?.() ?? 0
  const seconds = trainingProgress.progress ? trainingProgress.getLiveCountdownSeconds?.() : null

  return (
    <>
      {/* Hidden progress tracker */}
      <ProgressTracker
        modelId={faceModelId}
        jobId={trainingJobId}
        onProgressUpdate={handleProgressUpdate}
        onComplete={handleTrainingComplete}
      />

      <div className="flex flex-col items-center justify-center space-y-6 p-12">
        {/* Progress Circle */}
        <div className="relative">
          <CircleProgress 
            value={progressPercentage} 
            size={120} 
            thickness={4}
            className="text-[#44E3C9]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-medium text-white">
            {t('faceModel.training')}
          </h3>
          <p className="text-sm text-[#C0CED8]">
            {trainingProgress.progress?.message || t('faceModel.trainingInitializing')}
          </p>
        </div>

        {/* Time Remaining */}
        {seconds !== null && (
          <div className="text-center">
            <p className="text-sm text-[#C0CED8]">
              {t('faceModel.timeRemaining')}: <Countdown seconds={seconds} />
            </p>
          </div>
        )}

        {/* Info Text */}
        <div className="text-center space-y-2 max-w-md">
          <p className="text-xs text-muted-foreground">
            {t('faceModel.trainingInfo')}
          </p>
          {trainingProgress.progress?.status === 'running' && (
            <p className="text-xs text-[#44E3C9]">
              {t('faceModel.canCloseInfo')}
            </p>
          )}
        </div>

        {/* Error State */}
        {showError && (
          <div className="text-center">
            <p className="text-sm text-red-400">
              {t('faceModel.trainingError')}: {trainingProgress.error}
            </p>
          </div>
        )}
      </div>
    </>
  )
}