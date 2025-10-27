'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

export interface SubscriptionInfo {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  
  // From subscriptions table
  credits?: number
  max_quality?: number
  character_training_included?: boolean
  display_name?: string
  image_url?: string
  max_characters?: number
  concurrent_jobs?: number
}

function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return path
}

export function useCurrentSubscription() {
  const { isAuthenticated } = useAuth()

  const query = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      const response = await fetch(getApiUrl('/api/subscription/current'))
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

  return query
}

