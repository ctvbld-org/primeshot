import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useQuery } from '@tanstack/react-query'
import { useOpenSubscriptionDialog } from '@/hooks/useOpenSubscriptionDialog'

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
 * 1. If user is not authenticated – open subscription dialog instead.
 * 2. If user lacks the required credits – open subscription dialog instead.
 * 3. Otherwise execute the action.
 *
 * Example:
 * const guard = useCreditGuard(3) // require 3 credits
 * <Button onClick={guard(handleGenerate)}>Generate</Button>
 */
export function useCreditGuard(requiredCredits: number = 1) {
  const { isAuthenticated } = useAuth()
  const openSubscriptionDialog = useOpenSubscriptionDialog()

  const { data: creditBalance } = useQuery<number>({
    queryKey: ['credit-balance'],
    queryFn: fetchCreditBalance,
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  })

  return useCallback(
    (action: () => void | Promise<void>) => {
      return () => {
        // If not logged in, show subscription/pricing dialog
        if (!isAuthenticated) {
          openSubscriptionDialog()
          return
        }

        // If balance not fetched yet, pessimistically block and open dialog
        if (creditBalance === undefined) {
          openSubscriptionDialog()
          return
        }

        if ((creditBalance ?? 0) < requiredCredits) {
          openSubscriptionDialog()
          return
        }

        // All good, run the actual action
        return action()
      }
    },
    [isAuthenticated, creditBalance, requiredCredits, openSubscriptionDialog]
  )
} 