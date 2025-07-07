import { useCallback } from 'react'
import { useAuth } from '@primeshot/common/hooks/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'
import { useOpenSigninModal } from '@/hooks/useOpenSigninModal'
import { useOpenCreditPackDialog } from '@/hooks/useOpenCreditPackDialog'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { useGenerationIntent } from '@/hooks/useGenerationIntent'

async function fetchCreditBalance(): Promise<number> {
  const res = await fetch('/api/credits/balance')
  if (!res.ok) {
    throw new Error('Failed to fetch credit balance')
  }
  const { balance } = await res.json()
  return balance as number
}

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

  const { data: creditBalance } = useQuery<number>({
    queryKey: ['credit-balance'],
    queryFn: fetchCreditBalance,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  })

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