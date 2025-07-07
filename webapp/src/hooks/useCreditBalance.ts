import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'

export function useCreditBalance() {
  return useQuery({
    queryKey: ['creditBalance'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('api/credits/balance'))
      if (!response.ok) {
        throw new Error('Failed to fetch credit balance')
      }
      const { balance } = await response.json()
      return balance as number
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 