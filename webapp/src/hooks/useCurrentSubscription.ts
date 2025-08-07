import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'

export interface SubscriptionInfo {
  plan_name: string
  status: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  max_resolution: string
  character_training_included: number
  character_training_used: number
}

export function useCurrentSubscription() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['currentSubscription'],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      const response = await fetch(getApiUrl('api/subscription/current'))
      if (!response.ok) {
        // Return null if subscription doesn't exist or failed to fetch
        return null
      }
      return response.json()
    },
    enabled: isAuthenticated, // Skip query when user is not authenticated
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 