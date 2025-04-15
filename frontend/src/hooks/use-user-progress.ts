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

        // Only throw if it's not a "no rows returned" error
        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setProgress(data)
          
          // Redirect to last active stage if not completed payment
          if (!isPaymentCompleted(data)) {
            router.push(`/app/${data.current_stage}`)
          }
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
  }, [session?.user, supabase, router])

  // Unified Update Progress Function
  async function updateProgress(
    targetStage: FlowStage, // Use the FlowStage type
    stageDataUpdate?: Record<string, any> // Optional data for the target stage
  ) {
    if (!session?.user) {
      console.warn('updateProgress called without user session.')
      return
    }
    const userId = session.user.id

    try {
      // Fetch existing progress first to ensure we have the latest
      // Use maybeSingle() to handle cases where no progress exists yet
      const { data: existingProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('completed_stages, stage_data')
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching existing user progress before update:', fetchError)
        // Depending on the error, we might want to stop or continue
        // For now, we'll try to continue, upsert might create it
      }

      // Determine the new set of completed stages
      const stageOrder: FlowStage[] = ['compositions', 'upload', 'review', 'payment', 'dashboard'];
      const existingStages: FlowStage[] = existingProgress?.completed_stages || [];
      let completedStages = Array.from(new Set(existingStages));
      const targetIndex = stageOrder.indexOf(targetStage);
      if (targetIndex > 0) {
          const previousStage = stageOrder[targetIndex - 1];
          if (!completedStages.includes(previousStage)) {
               completedStages.push(previousStage); // Add the previous stage as completed
          }
      }
      // Ensure the target stage itself isn't marked as completed yet
      completedStages = completedStages.filter(s => s !== targetStage);

      // Merge stage data correctly
      const newStageData = {
        ...(existingProgress?.stage_data as any || {}), // Use existing data as base
        ...(stageDataUpdate ? { [targetStage]: stageDataUpdate } : {}) // Overwrite/add data for the target stage
      }

      // Prepare data for upsert
      const upsertData = {
        user_id: userId,
        current_stage: targetStage,
        completed_stages: completedStages,
        stage_data: newStageData,
        last_active_at: new Date().toISOString()
      }

      // Perform the upsert operation
      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert(upsertData, { onConflict: 'user_id' }) // Specify user_id for conflict resolution

      if (upsertError) {
        console.error('Error upserting user progress:', upsertError)
        throw upsertError // Re-throw to be caught by calling function
      }

      // Update local state optimistically or after refetching
      // For simplicity, let's update optimistically based on upsertData
      // Note: This assumes upsertData matches the UserProgress type structure
      setProgress(prev => ({
         ...(prev ?? { id: '', created_at: '', updated_at: '' }), // Provide defaults if prev is null
         ...upsertData 
      }) as UserProgress)

      console.log(`User progress upserted. Current stage: ${targetStage}, Completed: ${completedStages.join(', ')}`)

    } catch (error) {
      console.error('Error in updateProgress function:', error)
      // Let calling function handle UI feedback (e.g., toast)
      throw error // Re-throw error
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