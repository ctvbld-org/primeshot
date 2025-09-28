import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

/**
 * Simplified credit balance hook with robust real-time updates
 * This version avoids complex channel configurations that can cause binding mismatches
 */
export function useCreditBalanceSimple() {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)

  const query = useQuery({
    queryKey: ['creditBalance'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('api/credits/balance'))
      if (!response.ok) {
        throw new Error('Failed to fetch credit balance')
      }
      const { balance } = await response.json()
      return balance as number
    },
    enabled: isAuthenticated,
    staleTime: 5000, // Very short stale time for frequent updates
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Fallback: poll every 30 seconds
  })

  // Simple real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const supabase = createClient()
    console.log(`📡 Setting up simple real-time subscription for user ${user.id}`)
    
    // Create a unique channel name
    const channelName = `credit-updates-${user.id}-${Date.now()}`
    const channel = supabase.channel(channelName)

    // Listen to user_credits changes only (most reliable)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_credits',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        console.log('💳 Credit balance changed - refreshing')
        queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
        queryClient.refetchQueries({ queryKey: ['creditBalance'] })
      }
    )

    // Simple subscription without complex error handling
    channel.subscribe((status) => {
      console.log(`📡 Subscription status: ${status}`)
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time updates active')
      }
    })

    channelRef.current = channel

    return () => {
      console.log('📡 Cleaning up subscription')
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [isAuthenticated, user?.id, queryClient])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  return query
}
