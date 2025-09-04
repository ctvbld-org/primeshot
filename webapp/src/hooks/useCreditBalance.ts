import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

export function useCreditBalance() {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()

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
    enabled: isAuthenticated, // Skip when not logged in
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  })

  // Realtime: invalidate balance when user's credits change
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    const supabase = createClient()
    const channel = supabase.channel(`user-credits-${user.id}`)

    // Any changes to user's credit transactions (earned/spent/expired)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_credits', filter: `user_id=eq.${user.id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
      }
    )

    // Fallback: listen to credit_usage inserts which always happen on spend
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'credit_usage', filter: `user_id=eq.${user.id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
      }
    )

    // Also listen to credit pack purchases (earned via purchase)
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'credit_pack_purchases', filter: `user_id=eq.${user.id}` },
      () => {
        queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
      }
    )

    channel.subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [isAuthenticated, user?.id, queryClient])

  return query
} 