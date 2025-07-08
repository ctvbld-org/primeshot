import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'

export interface SubscriptionInfo {
  plan_name: string
  status: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  max_resolution: string
  face_model_training_included: number
  face_model_training_used: number
}

export function useCurrentSubscription() {
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
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  })
} 