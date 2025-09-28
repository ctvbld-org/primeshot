import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

export function useCreditBalance() {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    staleTime: 10000, // Consider data stale after 10 seconds (reduced for faster updates)
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
  })

  // Invalidate and refetch credit balance
  const invalidateBalance = useCallback(() => {
    console.log('💳 Credit balance change detected - invalidating cache')
    queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ['creditBalance'] })
  }, [queryClient])

  // Setup real-time subscription with enhanced error handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!isAuthenticated || !user?.id) return

    const supabase = createClient()
    const channelName = `user-credits-${user.id}`
    
    console.log(`📡 Setting up real-time subscription for user ${user.id}`)
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: user.id }
      }
    })

    // Listen to user_credits table changes (primary source)
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_credits', 
        filter: `user_id=eq.${user.id}` 
      },
      (payload) => {
        console.log('💳 user_credits change detected:', payload.eventType, payload.new)
        invalidateBalance()
      }
    )

    // Listen to credit_usage table changes (fallback)
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'credit_usage', 
        filter: `user_id=eq.${user.id}` 
      },
      (payload) => {
        console.log('💳 credit_usage change detected:', payload.eventType, payload.new)
        invalidateBalance()
      }
    )

    // Listen to credit pack purchases
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'credit_pack_purchases', 
        filter: `user_id=eq.${user.id}` 
      },
      (payload) => {
        console.log('💳 credit_pack_purchases change detected:', payload.eventType, payload.new)
        invalidateBalance()
      }
    )

    // Handle subscription status changes
    channel.on('system', {}, (payload) => {
      console.log('📡 Real-time system event:', payload)
      if (payload.extension === 'postgres_changes') {
        if (payload.status === 'ok') {
          console.log('✅ Real-time subscription established successfully')
        } else if (payload.status === 'error') {
          console.error('❌ Real-time subscription error:', payload.message)
          // Attempt to reconnect after a delay
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect real-time subscription...')
            setupRealtimeSubscription()
          }, 5000)
        }
      }
    })

    // Subscribe and handle connection status
    channel.subscribe((status, err) => {
      console.log(`📡 Real-time subscription status: ${status}`)
      if (err) {
        console.error('❌ Real-time subscription error:', err)
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to real-time updates')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time channel error')
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect after channel error...')
          setupRealtimeSubscription()
        }, 3000)
      }
    })

    channelRef.current = channel

    return () => {
      console.log('📡 Cleaning up real-time subscription')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [isAuthenticated, user?.id, invalidateBalance])

  // Setup real-time subscription
  useEffect(() => {
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [setupRealtimeSubscription])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  return query
} 