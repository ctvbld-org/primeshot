'use client'

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '@primeshot/common'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

interface CreditBalanceContextValue {
  balance: number | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
  invalidateBalance: () => void
}

const CreditBalanceContext = createContext<CreditBalanceContextValue | null>(null)

export function CreditBalanceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    staleTime: 30000, // 30 seconds - increased from 10s
    gcTime: 300000,
    refetchOnWindowFocus: false, // Disabled to prevent excessive refetches
  })

  // Debounced invalidate to prevent rapid successive refetches
  const debouncedInvalidate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
      queryClient.refetchQueries({ queryKey: ['creditBalance'] })
    }, 500) // 500ms debounce
  }, [queryClient])

  // Immediate invalidate (for manual triggers)
  const invalidateBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['creditBalance'] })
    queryClient.refetchQueries({ queryKey: ['creditBalance'] })
  }, [queryClient])

  // Setup real-time subscription (single subscription for entire app)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const supabase = createClient()
    const channelName = `credit-balance-global-${user.id}`
    
    const channel = supabase.channel(channelName)

    // Listen to user_credits table changes
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_credits', 
        filter: `user_id=eq.${user.id}` 
      },
      () => {
        debouncedInvalidate()
      }
    )

    // Listen to credit_usage table changes
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'credit_usage', 
        filter: `user_id=eq.${user.id}` 
      },
      () => {
        debouncedInvalidate()
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
      () => {
        debouncedInvalidate()
      }
    )

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[CreditBalance] Real-time subscription active')
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.warn('[CreditBalance] Connection issue, will retry')
      }
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [isAuthenticated, user?.id, debouncedInvalidate])

  const value: CreditBalanceContextValue = {
    balance: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidateBalance,
  }

  return (
    <CreditBalanceContext.Provider value={value}>
      {children}
    </CreditBalanceContext.Provider>
  )
}

export function useCreditBalanceContext() {
  const context = useContext(CreditBalanceContext)
  if (!context) {
    throw new Error('useCreditBalanceContext must be used within CreditBalanceProvider')
  }
  return context
}

