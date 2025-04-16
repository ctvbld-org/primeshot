'use client'

import { createClient } from '@/lib/supabase/client'
import type { FlowStage } from '@/types/flow'

/**
 * Ensures that a user progress record exists for the given user ID.
 * If no record exists, it creates one starting at the 'compositions' stage.
 * 
 * @param userId The ID of the user.
 * @returns The existing or newly created user progress record.
 */
export async function ensureUserProgress(userId: string) {
  const supabase = createClient()

  const { data: existingProgress, error: fetchError } = await supabase
    .from('user_progress')
    .select()
    .eq('user_id', userId)
    .single()

  // Ignore 'PGRST116' (No rows found) error, throw others
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user progress:', fetchError)
    throw new Error('Could not fetch user progress.')
  }

  if (existingProgress) {
    return existingProgress // Progress already exists
  } else {
    // Create initial progress record
    const { data: newProgress, error: createError } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        current_stage: 'compositions' as FlowStage, // Explicitly type cast
        completed_stages: [],
        last_active_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError || !newProgress) {
      console.error('Error creating initial user progress:', createError)
      throw new Error('Could not initialize user progress.')
    }
    return newProgress
  }
} 