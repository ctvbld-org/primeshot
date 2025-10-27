// Website implementation - handles character creation with auth/subscription checks
import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'

interface UseCreateCharacterProps {
  characters: any[]
  onSelectCharacter: (modelId: string) => void
  refreshCharacters: () => void
  onOpenSignInDialog?: () => void // Callback to open sign-in dialog
}

type ActionType = 'auth' | 'subscription' | 'upgrade_subscription' | 'credit_pack' | 'upgrade_or_credit_pack' | 'limit_reached' | 'create'

export function useCreateCharacter(props: UseCreateCharacterProps) {
  const { onOpenSignInDialog } = props
  const { isAuthenticated } = useAuth()
  const { hasActiveSubscription } = useSubscriptionStatus()
  const { saveIntent } = useGenerationIntent()

  // Determine what action should happen when create character is clicked
  const createCharacterAction = useMemo(() => {
    if (!isAuthenticated) {
      return { 
        type: 'auth' as ActionType, 
        message: 'Create',
        credits: 0
      }
    }
    
    if (!hasActiveSubscription) {
      return { 
        type: 'subscription' as ActionType, 
        message: 'Create',
        credits: 0
      }
    }

    // User has subscription - redirect to create page
    return { 
      type: 'create' as ActionType, 
      message: 'Create',
      credits: 0
    }
  }, [isAuthenticated, hasActiveSubscription])

  const handleCreateCharacterClick = useCallback(() => {
    if (!isAuthenticated) {
      // Save intent and open sign-in dialog
      saveIntent(0, 'create_character')
      if (onOpenSignInDialog) {
        onOpenSignInDialog()
      }
    } else if (!hasActiveSubscription) {
      // Redirect to pricing
      window.location.href = '/pricing'
    } else {
      // Has subscription - redirect to create page
      window.location.href = '/create'
    }
  }, [isAuthenticated, hasActiveSubscription, saveIntent, onOpenSignInDialog])

  return {
    createCharacterAction,
    handleCreateCharacterClick,
    requiresCreditsForTraining: false,
    trainingCost: 0,
    remainingIncludedTrainings: 0,
    isOnHighestTier: false
  }
}
