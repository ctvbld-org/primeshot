import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreditBalance } from './useCreditBalance'

/**
 * Hook that provides optimistic credit balance updates
 * This allows immediate UI feedback when credits are spent
 */
export function useCreditBalanceOptimistic() {
  const creditBalance = useCreditBalance()
  const queryClient = useQueryClient()

  // Optimistically update credit balance when spending credits
  const optimisticallySpendCredits = useCallback((amount: number) => {
    queryClient.setQueryData(['creditBalance'], (oldBalance: number | undefined) => {
      const currentBalance = oldBalance ?? 0
      const newBalance = Math.max(0, currentBalance - amount)
      return newBalance
    })
  }, [queryClient])

  // Optimistically update credit balance when earning credits
  const optimisticallyEarnCredits = useCallback((amount: number) => {
    queryClient.setQueryData(['creditBalance'], (oldBalance: number | undefined) => {
      const currentBalance = oldBalance ?? 0
      const newBalance = currentBalance + amount
      return newBalance
    })
  }, [queryClient])

  // Revert optimistic update (in case of error)
  const revertOptimisticUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
  }, [queryClient])

  return {
    ...creditBalance,
    optimisticallySpendCredits,
    optimisticallyEarnCredits,
    revertOptimisticUpdate,
  }
}
