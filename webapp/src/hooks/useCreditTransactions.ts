import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@primeshot/common'

export interface CreditTransaction {
  id: string
  credits: number
  transaction_type: 'earned' | 'spent' | 'expired'
  source_type: 'subscription' | 'credit_pack' | 'refund' | 'admin'
  description: string
  created_at: string
  expires_at?: string
}

export function useCreditTransactions(limit = 10) {
  return useQuery({
    queryKey: ['creditTransactions', limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      const response = await fetch(getApiUrl(`api/credits/transactions?limit=${limit}`))
      if (!response.ok) {
        throw new Error('Failed to fetch credit transactions')
      }
      const { transactions } = await response.json()
      return transactions || []
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 