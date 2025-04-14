'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { FlowStage } from '@/types/flow'
import { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type UserProgress = Tables['user_progress']['Row']
type StageData = {
  compositions?: {
    savedCount: number
    lastSavedAt?: string
  }
  upload?: {
    uploadedFiles: string[]
    uploadProgress: number
    lastUploadAt?: string
  }
  review?: {
    reviewedImages: string[]
    rejectedImages: string[]
    lastReviewAt?: string
  }
  payment?: {
    attemptCount: number
    lastAttemptAt?: string
  }
}

export function useUserProgress() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<UserProgress | null>(null)

  // Load progress on mount
  useEffect(() => {
    if (!session?.user) return

    async function loadProgress() {
      try {
        if (!session || !session.user) return;
        
        const { data, error } = await supabase
          .from('user_progress')
          .select()
          .eq('user_id', session.user.id)
          .single()

        if (error) throw error

        setProgress(data)
        
        // Redirect to last active stage if not completed payment
        if (data && !isPaymentCompleted(data)) {
          router.push(`/app/${data.current_stage}`)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [session?.user, supabase, router])

  // Update progress
  async function updateProgress(
    currentStage: FlowStage,
    completedStages: FlowStage[] = [],
    stageData: Partial<StageData> = {}
  ) {
    if (!session?.user) return

    try {
      const updatedProgress = {
        user_id: session.user.id,
        current_stage: currentStage,
        completed_stages: completedStages,
        stage_data: {
          ...(progress?.stage_data as any),
          ...stageData
        },
        last_active_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_progress')
        .upsert(updatedProgress)

      if (error) throw error

      setProgress(updatedProgress as UserProgress)
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  // Clear progress after payment
  async function clearProgress() {
    if (!session?.user || !progress) return

    try {
      // Archive for analytics
      await supabase
        .from('completed_user_journeys')
        .insert({
          user_id: session.user.id,
          journey_data: progress
        })

      // Delete progress
      await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', session.user.id)

      setProgress(null)
    } catch (error) {
      console.error('Error clearing progress:', error)
      throw error
    }
  }

  // Validate stage access
  function validateStageAccess(stage: FlowStage): boolean {
    if (!progress) return stage === 'compositions'

    const stageOrder: FlowStage[] = [
      'compositions',
      'upload',
      'review',
      'payment',
      'dashboard'
    ]
    
    const currentIndex = stageOrder.indexOf(stage)
    const completedIndex = Math.max(
      ...progress.completed_stages.map((s: FlowStage) => stageOrder.indexOf(s))
    )
    
    return currentIndex <= completedIndex + 1
  }

  // Check if payment is completed
  function isPaymentCompleted(userProgress: UserProgress): boolean {
    return userProgress.completed_stages.includes('payment')
  }

  return {
    progress,
    isLoading,
    updateProgress,
    clearProgress,
    validateStageAccess,
    isPaymentCompleted: progress ? isPaymentCompleted(progress) : false
  }
} 