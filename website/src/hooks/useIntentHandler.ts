'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGenerationIntent } from './useGenerationIntent'
import { useSubscriptionStatus } from './useSubscriptionStatus'

export function useIntentHandler() {
  const { isAuthenticated } = useAuth()
  const { getIntent, clearIntent } = useGenerationIntent()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus()

  useEffect(() => {
    // Only process intent when user becomes authenticated
    if (!isAuthenticated) return

    const intent = getIntent()
    if (!intent) return

    // Wait for subscription status to load
    if (subscriptionLoading) return

    console.log('Processing intent after sign-in:', intent.actionType)

    // Handle different intent types
    if (intent.actionType === 'subscribe' || intent.actionType === 'generate_images') {
      // For subscribe/generate intents, always redirect to pricing
      clearIntent()
      window.location.href = '/pricing'
    } else if (intent.actionType === 'create_shoot' || intent.actionType === 'create_character') {
      // For create intents, check subscription status
      clearIntent()
      if (hasActiveSubscription) {
        // User has subscription, redirect to create page
        window.location.href = '/create'
      } else {
        // User doesn't have subscription, redirect to pricing
        window.location.href = '/pricing'
      }
    }
  }, [isAuthenticated, subscriptionLoading, hasActiveSubscription, getIntent, clearIntent])
}

