import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionInfo {
  // Canonical key used to join with pricing tiers
  plan_name: string
  // Human-friendly label for UI
  plan_display_name?: string
  status: string
  current_period_start: string
  current_period_end: string
  credits_included: number
  credits_used_this_period: number
  max_quality: string
  character_training_included: number
  character_training_used: number
  // Limits exposed directly by API for reliability
  max_characters?: number
  concurrent_jobs?: number
}

export function useCurrentSubscription() {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
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

  // Realtime: invalidate subscription when user's subscription rows change
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel(`user-subscription-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['currentSubscription'] })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, user?.id, queryClient])

  return query
} 