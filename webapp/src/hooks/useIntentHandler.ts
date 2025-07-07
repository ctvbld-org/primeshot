import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGenerationIntent } from './useGenerationIntent'
import { useSubscriptionStatus } from './useSubscriptionStatus'
import { useOpenSubscriptionDialog } from './useOpenSubscriptionDialog'
import { useOpenCreditPackDialog } from './useOpenCreditPackDialog'
import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'

async function fetchCreditBalance(): Promise<number> {
  const res = await fetch(getApiUrl('api/credits/balance'))
  if (!res.ok) {
    throw new Error('Failed to fetch credit balance')
  }
  const { balance } = await res.json()
  return balance as number
}

export function useIntentHandler() {
  const { isAuthenticated } = useAuth()
  const { getIntent, clearIntent } = useGenerationIntent()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openCreditPackDialog = useOpenCreditPackDialog()

  const { data: creditBalance } = useQuery<number>({
    queryKey: ['credit-balance'],
    queryFn: fetchCreditBalance,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  })

  useEffect(() => {
    // Only process intent when user becomes authenticated
    if (!isAuthenticated) return

    const intent = getIntent()
    if (!intent) return

    // console.log('Processing intent:', { 
    //   subscriptionLoading, 
    //   hasActiveSubscription, 
    //   creditBalance,
    //   requiredCredits: intent.requiredCredits 
    // })

    // Wait for subscription status to load
    if (subscriptionLoading) {
      // console.log('Waiting for subscription status to load...')
      return
    }

    // Check subscription status
    if (!hasActiveSubscription) {
      console.log('No active subscription, opening subscription dialog')
      // User doesn't have active subscription, show subscription dialog
      openSubscriptionDialog()
      clearIntent() // Clear intent since we're showing subscription dialog
      return
    }

    // Check credit balance
    if (creditBalance !== undefined) {
      if (creditBalance < intent.requiredCredits) {
        // User has subscription but insufficient credits, show credit pack dialog
        openCreditPackDialog(intent.requiredCredits)
        return
      }

      // User has subscription and enough credits, trigger the appropriate action
      if (intent.actionType === 'generate_images') {
        // Trigger the image generation - this will be handled by the component
        console.log('Ready to generate images - triggering generation')
        // We'll emit a custom event that the generation component can listen to
        window.dispatchEvent(new CustomEvent('execute-generation-intent', { 
          detail: intent 
        }))
      }
      clearIntent()
    }
  }, [
    isAuthenticated,
    subscriptionLoading,
    hasActiveSubscription,
    creditBalance,
    getIntent,
    clearIntent,
    openSubscriptionDialog,
    openCreditPackDialog
  ])
} 