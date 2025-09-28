import { QueryClient } from '@tanstack/react-query'

/**
 * Utility functions for optimistic credit balance updates
 * These provide immediate UI feedback when credits are spent or earned
 */

export interface CreditUpdateOptions {
  queryClient: QueryClient
  amount: number
  operation: 'spend' | 'earn'
  context?: string
}

/**
 * Optimistically update credit balance
 */
export function optimisticallyUpdateCredits({ 
  queryClient, 
  amount, 
  operation, 
  context = 'unknown' 
}: CreditUpdateOptions) {
  console.log(`💳 Optimistically ${operation}ing ${amount} credits (${context})`)
  
  queryClient.setQueryData(['creditBalance'], (oldBalance: number | undefined) => {
    const currentBalance = oldBalance ?? 0
    const newBalance = operation === 'spend' 
      ? Math.max(0, currentBalance - amount)
      : currentBalance + amount
    
    console.log(`💳 Optimistic balance update (${context}): ${currentBalance} → ${newBalance}`)
    return newBalance
  })
}

/**
 * Revert optimistic credit update in case of error
 */
export function revertOptimisticCreditUpdate(queryClient: QueryClient, context?: string) {
  console.log(`💳 Reverting optimistic credit update${context ? ` (${context})` : ''}`)
  queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
  queryClient.refetchQueries({ queryKey: ['creditBalance'] })
}

/**
 * Hook into inference job creation to provide optimistic updates
 */
export function withOptimisticCreditUpdate<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  queryClient: QueryClient,
  creditCost: number,
  context: string = 'operation'
): T {
  return (async (...args: Parameters<T>) => {
    // Optimistically spend credits
    optimisticallyUpdateCredits({
      queryClient,
      amount: creditCost,
      operation: 'spend',
      context
    })

    try {
      // Execute the original function
      const result = await fn(...args)
      
      // If successful, the real-time subscription will handle the actual update
      console.log(`✅ ${context} completed successfully, real-time will sync actual balance`)
      
      return result
    } catch (error) {
      // If failed, revert the optimistic update
      console.error(`❌ ${context} failed, reverting optimistic update:`, error)
      revertOptimisticCreditUpdate(queryClient, context)
      throw error
    }
  }) as T
}
