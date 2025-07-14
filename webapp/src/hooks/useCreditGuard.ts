import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCreditBalance } from './useCreditBalance'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { useOpenSigninModal } from '@/hooks/useOpenSigninModal'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'

/**
 * Hook that returns a guard function. Wrap any action with it and it will:
 * 1. If user is not authenticated – open signin modal and save intent
 * 2. If user has no active subscription – open subscription dialog
 * 3. If user lacks the required credits – open credit packs dialog
 * 4. Otherwise execute the action.
 *
 * Example:
 * const guard = useCreditGuard(3) // require 3 credits
 * <Button onClick={guard(handleGenerate)}>Generate</Button>
 */
export function useCreditGuard(requiredCredits: number = 1) {
  const { isAuthenticated } = useAuth()
  const openSubscriptionDialog = useOpenSubscriptionDialog()
  const openSigninModal = useOpenSigninModal()
  const openCreditPackDialog = useOpenCreditPackDialog()
  const { hasActiveSubscription } = useSubscriptionStatus()
  const { saveIntent } = useGenerationIntent()

  const { data: creditBalance } = useCreditBalance()

  const guard = useCallback(
    (action: () => void | Promise<void>) => {
      return () => {
        // If not logged in, save intent and show signin modal
        if (!isAuthenticated) {
          saveIntent(requiredCredits, 'generate_images')
          openSigninModal()
          return
        }

        // If no active subscription, show subscription dialog
        if (!hasActiveSubscription) {
          openSubscriptionDialog()
          return
        }

        // If balance not fetched yet, pessimistically block and open subscription dialog
        if (creditBalance === undefined) {
          openSubscriptionDialog()
          return
        }

        // If insufficient credits, show credit packs dialog
        if ((creditBalance ?? 0) < requiredCredits) {
          openCreditPackDialog(requiredCredits)
          return
        }

        // All good, run the actual action
        return action()
      }
    },
    [
      isAuthenticated, 
      hasActiveSubscription,
      creditBalance, 
      requiredCredits, 
      saveIntent,
      openSigninModal,
      openSubscriptionDialog,
      openCreditPackDialog
    ]
  )

  return guard
} 