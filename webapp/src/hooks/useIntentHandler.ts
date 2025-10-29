import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGenerationIntent } from './useGenerationIntent'
import { useSubscriptionStatus } from './useSubscriptionStatus'
import { useOpenSubscriptionDialog } from './useOpenSubscriptionDialog'
import { useOpenCreditPackDialog } from './useOpenCreditPackDialog'
import { useCreditBalance } from './useCreditBalance'
import { useCurrentSubscription } from './useCurrentSubscription'
import { useSubscriptionTiers } from './usePricingConfig'

export function useIntentHandler() {
  const { isAuthenticated } = useAuth()
  const { getIntent, clearIntent } = useGenerationIntent()
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscriptionStatus()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const { data: subscription } = useCurrentSubscription()
  const { data: subscriptionTiers } = useSubscriptionTiers()

  const { data: creditBalance } = useCreditBalance()

  // Check if user is on the highest subscription tier
  const isOnHighestTier = (() => {
    if (!subscription?.plan_name || !subscriptionTiers) return false
    const tier = subscriptionTiers.find(t => t.name === subscription.plan_name)
    // Treat max tier by having the largest max_characters
    const max = Math.max(...subscriptionTiers.map(t => t.max_characters || 0))
    return (tier?.max_characters || 0) >= max
  })()

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
        // User has subscription but insufficient credits
        // Check tier to determine which dialog to show
        if (!isOnHighestTier) {
          // Users not on highest tier should be offered to upgrade
          openSubscriptionDialog({
            context: 'credit-upgrade',
            currentPlan: subscription?.plan_name,
            showOnlyUpgrades: true
          })
        } else {
          // Users on highest tier can only buy credit packs
          openCreditPackDialog(intent.requiredCredits)
        }
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
    openCreditPackDialog,
    isOnHighestTier,
    subscription?.plan_name
  ])
} 