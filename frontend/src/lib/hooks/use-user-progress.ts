'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { FlowStage } from '@/types/flow'
import { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'

type Tables = Database['public']['Tables']
type UserProgress = Tables['user_progress']['Row']
type StageData = {
  shoot?: {
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
  const { user } = useAuth()

  // Load progress on mount
  useEffect(() => {
    async function loadProgress() {
      // Check for user ID inside the async function
      const userId = session?.user?.id;
      if (!userId) return
      
      try {
        const { data, error } = await supabase
          .from('user_progress')
          .select()
          .eq('user_id', userId)
          .single()

        // Only throw if it's not a "no rows returned" error
        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setProgress(data)
          
          // Redirect to last active stage if not completed payment
          // REMOVED: This redirect was causing issues when intentionally navigating.
          // Page-specific redirects should handle access control.
          // if (!isPaymentCompleted(data)) {
          //   router.push(`/app/${data.current_stage}`)
          // }
        } else {
          // No progress exists yet, set to null
          setProgress(null)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
    // Only depend on the user ID, not the whole session object
  }, [session?.user?.id, supabase, router])

  // Update Progress: Only update current_stage if moving forward in the main sequence
  const updateProgress = useCallback(async (stage: FlowStage, stageData?: StageData) => {
    if (!user) return;

    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('completed_stages, stage_data')
        .eq('user_id', user.id)
        .single();

      // Initialize completed stages
      const completedStages = existingProgress?.completed_stages || [];
      if (!completedStages.includes(stage)) {
        completedStages.push(stage);
      }

      // Merge existing stage data with new stage data
      const mergedStageData: StageData = {
        ...(existingProgress?.stage_data as StageData || {}),
        ...(stageData || {})
      };

      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          current_stage: stage,
          completed_stages: completedStages,
          stage_data: mergedStageData,
          last_active_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Error upserting progress:', upsertError);
        throw upsertError;
      }

      // Update local state
      setProgress(prev => ({
        ...prev,
        user_id: user.id,
        current_stage: stage,
        completed_stages: completedStages,
        stage_data: mergedStageData,
        last_active_at: new Date().toISOString()
      } as UserProgress));

    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [user, supabase]);

  // Clear progress after payment
  async function clearProgress() {
    if (!session?.user || !progress) return

    try {
      // Archive for analytics
      await supabase
        .from('completed_user_journeys')
        .insert({
          user_id: session.user.id,
          journey_data: progress,
          completed_at: new Date().toISOString()
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

  // Validate stage access - modified
  function validateStageAccess(pageStage: FlowStage): boolean {
    if (!progress) return pageStage === 'shoot' // Allow shoot page initially

    const stageOrder: FlowStage[] = ['shoot', 'payment', 'upload', 'review', 'albums']
    const currentPageIndex = stageOrder.indexOf(pageStage)
    const maxCompletedIndex = Math.max(
      ...((progress.completed_stages as FlowStage[]) || []).map(s => stageOrder.indexOf(s)),
      -1 // Start at -1 if nothing is completed
    )

    // If payment is completed, enforce strict sequential access
    if (isPaymentCompleted(progress)) {
      return currentPageIndex <= maxCompletedIndex + 1
    }
    
    // Before payment is completed:
    // Allow access to shoot and payment stages only
    return pageStage === 'shoot' || pageStage === 'payment'
  }

  // Special function to check if user can modify styles
  function canModifyStyles(): boolean {
    if (!progress) return true
    
    // Can modify styles until payment is completed
    return !isPaymentCompleted(progress)
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
    canModifyStyles,
    isPaymentCompleted: progress ? isPaymentCompleted(progress) : false
  }
} 