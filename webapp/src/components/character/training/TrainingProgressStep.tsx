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
import styles from '../CharacterTrainingDialog.module.css'
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
  const [pendingSince, setPendingSince] = useState<number | null>(null)
  
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
    // Track when we enter/exit pending to suppress brief cold-start flashes
    if (jobStatus?.status === 'pending') {
      if (pendingSince === null) setPendingSince(Date.now())
    } else if (pendingSince !== null) {
      setPendingSince(null)
    }

    if (jobStatus?.status === 'completed') {
      onComplete?.()
    } else if (jobStatus?.status === 'failed') {
      onError?.(jobStatus.error_message || t('character.trainingError'))
    }
  }, [jobStatus?.status, jobStatus?.error_message, onComplete, onError, t, pendingSince])

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
  // Do not gate the countdown on progress; show running label immediately and attach countdown when available
  const seconds = trainingProgress.getLiveCountdownSeconds?.() ?? null
  
  // Prefer WebSocket progress status when available; fall back to DB status
  const wsStatus = (trainingProgress as any)?.progress?.status as string | undefined
  const wsInitializing = wsStatus === 'initializing'
  const wsQueued = wsStatus === 'queued' || wsStatus === 'pending'
  const wsRunning = wsStatus === 'running'
  const wsCompleted = wsStatus === 'completed'
  const wsFailed = wsStatus === 'failed'

  // Merge WS + DB states (WS takes precedence when present)
  const isInitializing = wsStatus ? wsInitializing : jobStatus?.status === 'initializing'
  const isQueued = wsStatus ? (wsQueued && !wsRunning && !wsCompleted && !wsFailed) : jobStatus?.status === 'queued'
  const isPending = wsStatus ? (wsStatus === 'pending') : jobStatus?.status === 'pending'
  const isRunning = wsStatus ? wsRunning : jobStatus?.status === 'running'
  const isCompleted = wsStatus ? wsCompleted : jobStatus?.status === 'completed'
  const isFailed = wsStatus ? wsFailed : jobStatus?.status === 'failed'
  const retryAfterIso = jobStatus?.retry_after || null

  // Show pending only if it persists beyond a short threshold to mask cold starts.
  // Allow override via NEXT_PUBLIC_PENDING_DISPLAY_DELAY_MS (ms), default 10s.
  const PENDING_DISPLAY_DELAY_MS = Number(process.env.NEXT_PUBLIC_PENDING_DISPLAY_DELAY_MS ?? 15000)
  const shouldShowPending = isPending && (pendingSince !== null && Date.now() - pendingSince >= PENDING_DISPLAY_DELAY_MS)

  // Build mutually exclusive title/description nodes to avoid duplicated messages
  const titleNode = isFailed
    ? t('character.trainingFailed')
    : isInitializing
    ? t('character.trainingInitializing')
    : isQueued
    ? t('character.trainingQueued')
    : shouldShowPending
    ? t('character.trainingPending')
    : isRunning
    ? (seconds !== null
        ? (<>{t('character.trainingRunning')} <Countdown seconds={seconds} /></>)
        : t('character.trainingRunningNoCountdown'))
    : t('character.trainingWarmingUp')

  const descriptionNode = isFailed
    ? t('character.trainingFailedDescription')
    : isInitializing
    ? t('character.trainingInitializingInfo')
    : isQueued
    ? t('character.trainingQueuedInfo')
    : shouldShowPending
    ? t('character.trainingPendingInfo')
    : isRunning
    ? t('character.trainingRunningInfo')
    : t('character.trainingWarmingUpInfo')

  return (
    <>
      {/* Always subscribe to WS progress; UI will decide messages via merged state */}
      <ProgressTracker
        key={`${characterId}-${trainingJobId}`}
        modelId={characterId}
        jobId={trainingJobId}
        onProgressUpdate={handleProgressUpdate}
        onComplete={handleTrainingComplete}
      />

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
            {isFailed ? (
              t('character.trainingFailed')
            ) : (
              <>
                <span>{titleNode}</span>
                {((!isRunning && seconds === null) || !isQueued || !isPending || !isFailed) && (
                  <span className={styles.dots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </span>
                )}
              </>
            )}
          </h3>
          <p className={styles.statusDescription}>
            {descriptionNode}
            
            {/* Error State */}
            {showError && (
              <p className="text-sm text-red-400">
                {t('character.trainingError')}: {trainingProgress.error}
              </p>
            )}
          </p>

          {(isRunning || isQueued || shouldShowPending) && (
            <Button variant="ghost" onClick={() => dialogService.closeDialog()}>
              {t('character.returnToApp')}
            </Button>
          )}
        </div>

      </div>
    </>
  )
}