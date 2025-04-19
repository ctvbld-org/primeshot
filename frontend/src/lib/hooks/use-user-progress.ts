'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { FlowStage } from '@/types/flow'
import { Database } from '@/types/supabase'

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
  async function updateProgress(
    targetStage: FlowStage, 
    stageDataUpdate?: Record<string, any> 
  ) {
    if (!session?.user) {
      console.warn('updateProgress called without user session.')
      return
    }
    const userId = session.user.id

    try {
      // Fetch existing progress first
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('current_stage, completed_stages, stage_data')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching existing user progress before update:', fetchError)
      }

      const stageOrder: FlowStage[] = ['shoot', 'payment', 'upload', 'review', 'dashboard'];
      const existingStages: FlowStage[] = existingProgress?.completed_stages || [];
      const currentActualStage = existingProgress?.current_stage || 'shoot';

      // Determine the new set of completed stages
      let completedStages = Array.from(new Set(existingStages));
      const targetIndex = stageOrder.indexOf(targetStage);
      if (targetIndex > 0) {
          const previousStage = stageOrder[targetIndex - 1];
          if (!completedStages.includes(previousStage)) {
               completedStages.push(previousStage);
          }
      }
      completedStages = completedStages.filter(s => s !== targetStage);

      // Merge stage data
      const newStageData = {
        ...(existingProgress?.stage_data as any || {}),
        ...(stageDataUpdate ? { [targetStage]: stageDataUpdate } : {})
      }
      
      // Determine the new current_stage - only update if moving forward in the main sequence
      let newCurrentStage = currentActualStage;
      const currentActualIndex = stageOrder.indexOf(currentActualStage);
      if (targetIndex > currentActualIndex) {
        newCurrentStage = targetStage;
      } else if (targetStage === 'payment' && currentActualStage === 'shoot') {
        // Special case: allow setting current_stage to payment when coming from shoot
        newCurrentStage = 'payment';
      }

      // Prepare data for upsert
      const upsertData = {
        user_id: userId,
        current_stage: newCurrentStage,
        completed_stages: completedStages,
        stage_data: newStageData,
        last_active_at: new Date().toISOString()
      }

      // Perform the upsert operation
      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert(upsertData, { onConflict: 'user_id' })

      if (upsertError) {
        console.error('Error upserting user progress:', upsertError)
        throw upsertError
      }

      // Update local state optimistically
      setProgress(prev => ({
         ...(prev ?? { id: '', created_at: '', updated_at: '' }),
         ...upsertData 
      }) as UserProgress)

      console.log(`User progress upserted. Current stage: ${newCurrentStage}, Completed: ${completedStages.join(', ')}`)

    } catch (error) {
      console.error('Error in updateProgress function:', error)
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

  // Validate stage access - modified
  function validateStageAccess(pageStage: FlowStage): boolean {
    if (!progress) return pageStage === 'shoot' // Allow shoot page initially

    const stageOrder: FlowStage[] = ['shoot', 'payment', 'upload', 'review', 'dashboard']
    const currentPageIndex = stageOrder.indexOf(pageStage)
    const maxCompletedIndex = Math.max(
      ...progress.completed_stages.map((s: FlowStage) => stageOrder.indexOf(s)),
      -1 // Start at -1 if nothing is completed
    )

    // If payment is completed, enforce strict sequential access
    if (isPaymentCompleted(progress)) {
      return currentPageIndex <= maxCompletedIndex + 1
    }
    
    // Before payment is completed:
    // Allow access to 'shoot' and 'payment' regardless of completion state
    if (pageStage === 'shoot' || pageStage === 'payment') {
      return true
    }
    
    // For other stages (upload, review, dashboard), require payment to be completed
    return false 
  }

  // Special function to check if user can navigate back and forth between shoot and payment
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