'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleProgress } from '@primeshot/common/web/ui/circle-progress'
import { ProgressTracker } from '../ProgressTracker'
import { Countdown } from '../Countdown'
import { useTrainingJobStatus } from '@/hooks/useTrainingJobStatus'
import { useCharactersApi } from '@/lib/api/characters'
import { useAuth } from '@/contexts/auth-context'
import { useDialogService } from '@/contexts/DialogServiceContext'
import { getApiUrl } from '@/lib/api/client'
import type { Character } from '@/types/jobs'
import styles from './ThumbnailStyles.module.css'
import { Button } from '@primeshot/common/web/ui/button'

interface TrainingProgressStepProps {
  characterId: string
  trainingJobId: string
  onComplete?: () => void
  onError?: (error: string) => void
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
  characterId, 
  trainingJobId,
  onComplete,
  onError 
}: TrainingProgressStepProps) {
  const { t } = useTranslation('upload')
  const { user } = useAuth()
  const { getCharacter } = useCharactersApi()
  const dialogService = useDialogService()
  
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgressState>({
    isConnected: false,
    isConnecting: true,
  })
  const [showError, setShowError] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)
  const [character, setCharacter] = useState<Character | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false)
  
  // Get training job status from database via real-time subscription
  const { data: jobStatus, isLoading: isLoadingJobStatus } = useTrainingJobStatus(trainingJobId)

  // Fetch character data
  useEffect(() => {
    const fetchCharacter = async () => {
      if (!user?.id || !characterId) return
      
      setIsLoadingCharacter(true)
      try {
        const characterData = await getCharacter(characterId, user.id)
        setCharacter(characterData)
      } catch (error) {
        console.error('Failed to fetch character:', error)
      } finally {
        setIsLoadingCharacter(false)
      }
    }
    
    fetchCharacter()
  }, [characterId, user?.id, getCharacter])

  // Fetch thumbnail URL when character is available
  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (!character?.thumbnail_url) {
        setThumbnailUrl(null)
        return
      }
      
      try {
        const response = await fetch(getApiUrl(`/api/user-images?url=${encodeURIComponent(character.thumbnail_url)}`))
        if (response.ok) {
          const { url } = await response.json()
          setThumbnailUrl(url)
        } else {
          console.warn('Failed to get signed URL for character thumbnail')
          setThumbnailUrl(null)
        }
      } catch (error) {
        console.error('Failed to create presigned URL for character thumbnail:', error)
        setThumbnailUrl(null)
      }
    }
    
    fetchThumbnailUrl()
  }, [character?.thumbnail_url])

  // Handle job status transitions
  useEffect(() => {
    if (jobStatus?.status === 'completed') {
      onComplete?.()
    } else if (jobStatus?.status === 'failed') {
      onError?.(jobStatus.error_message || t('character.trainingError'))
    }
  }, [jobStatus?.status, jobStatus?.error_message, onComplete, onError, t])

  // Start a timer after mount or when job/model changes
  useEffect(() => {
    setHasSettled(false)
    const timer = setTimeout(() => setHasSettled(true), 1000)
    return () => clearTimeout(timer)
  }, [characterId, trainingJobId])

  // Handler for progress updates
  const handleProgressUpdate = useCallback((modelId: string, data: TrainingProgressState) => {
    setTrainingProgress(data)
  }, [])

  // Handler for training completion - now handles both success and failure
  const handleTrainingComplete = useCallback((modelId: string, success?: boolean, errorMessage?: string) => {
    if (success === false) {
      // Training failed
      const error = errorMessage || t('character.trainingError')
      onError?.(error)
    } else {
      // Training completed successfully
      onComplete?.()
    }
  }, [onComplete, onError, t])

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
  
  // Determine if job is queued based on database status
  const isPending = jobStatus?.status === 'pending'
  const isQueued = jobStatus?.status === 'queued' || isPending
  const isRunning = jobStatus?.status === 'running'
  const retryAfterIso = jobStatus?.retry_after || null
  const retryAfterText = retryAfterIso ? new Date(retryAfterIso).toLocaleTimeString() : null

  return (
    <>
      {/* Hidden progress tracker - only show for running jobs */}
      {isRunning && (
        <ProgressTracker
          key={`${characterId}-${trainingJobId}`}
          modelId={characterId}
          jobId={trainingJobId}
          onProgressUpdate={handleProgressUpdate}
          onComplete={handleTrainingComplete}
        />
      )}

      <div className="flex flex-col items-center justify-center space-y-6 p-12">
        {/* Character Thumbnail */}
        <div className={styles.thumbnailContainer}>
          <div className={styles.thumbnail}>
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl}
                alt={character?.name ? `${character.name} training` : "Character training"}
                className={styles.thumbnailImage}
              />
            ) : (
              <div className={styles.thumbnailPlaceholder}>
                {isLoadingCharacter ? (
                  <div className="animate-pulse bg-gray-600 w-full h-full rounded-[30px]" />
                ) : (
                  <div className="bg-gray-600 w-full h-full rounded-[30px] flex items-center justify-center text-gray-400 text-xs">
                    {character?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}
            <CircleProgress 
              value={progressPercentage}
              size={96} 
              thickness={4}
              className="rounded-[30px]"
            />
          </div>
        </div>

        {/* Status Text */}
        <div className={styles.statusContainer}>
          <h3 className={styles.statusTitle}>
            {isQueued 
              ? 
                <span>
                  {t('character.trainingInitializing')}
                  <span className={styles.dots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </span>
                </span>
              :  seconds !== null ? (<span>About <Countdown seconds={seconds} /> remaining</span>) : t('character.trainingInitializing')
            }
          </h3>
          <p className={styles.statusDescription}>
            {isQueued ? (
              isPending
                ? t('character.providerQueuedInfo')
                : retryAfterText
                  ? `${t('character.queuedInfo')} · Retrying at ${retryAfterText}`
                  : t('character.queuedInfo')
            ) : (
              isRunning && trainingProgress.progress?.status === 'running' ? t('character.canCloseInfo') : t('character.trainingInitializingInfo')
            )}

            {/* Error State */}
            {showError && (
              <p className="text-sm text-red-400">
                {t('character.trainingError')}: {trainingProgress.error}
              </p>
            )}
          </p>

          {!isQueued && (
            <Button variant="ghost" onClick={() => dialogService.closeDialog()}>
              {t('character.returnToApp')}
            </Button>
          )}
        </div>

      </div>
    </>
  )
}