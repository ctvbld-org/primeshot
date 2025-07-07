import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'

interface SubscriptionInfo {
  plan_name: string
  status: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  max_resolution: string
  lora_training_included: number
  lora_training_used: number
  cancel_at_period_end: boolean
  current_period_start: string
  stripe_subscription_id: string
  created_at: string
  updated_at: string
}

async function fetchSubscriptionStatus(): Promise<SubscriptionInfo | null> {
  const res = await fetch('/api/subscription/current')
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized')
    }
    throw new Error('Failed to fetch subscription status')
  }
  
  const data = await res.json()
  return data // null if no active subscription
}

export function useSubscriptionStatus() {
  const { isAuthenticated } = useAuth()

  const { data: subscription, isLoading, error } = useQuery<SubscriptionInfo | null>({
    queryKey: ['subscription-status'],
    queryFn: fetchSubscriptionStatus,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message === 'Unauthorized') return false
      return failureCount < 3
    }
  })

  return {
    subscription,
    hasActiveSubscription: !!subscription && subscription.status === 'active',
    isLoading,
    error
  }
} 