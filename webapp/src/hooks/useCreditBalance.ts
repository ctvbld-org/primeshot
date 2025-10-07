import { useCreditBalanceContext } from '@/contexts/credit-balance-context'

/**
 * Hook to access credit balance from context
 * This is a wrapper around useCreditBalanceContext for backward compatibility
 * 
 * @deprecated Use useCreditBalanceContext directly for new code
 */
export function useCreditBalance() {
  const context = useCreditBalanceContext()
  
  return {
    data: context.balance,
    isLoading: context.isLoading,
    error: context.error,
    refetch: context.refetch,
    invalidateBalance: context.invalidateBalance,
  }
}
