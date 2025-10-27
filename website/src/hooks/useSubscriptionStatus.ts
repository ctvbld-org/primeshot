'use client'

import { useCurrentSubscription } from './useCurrentSubscription'

export function useSubscriptionStatus() {
  const {
    data: subscription,
    isLoading,
    error,
  } = useCurrentSubscription()

  return {
    subscription,
    hasActiveSubscription: !!subscription && subscription.status === 'active',
    isLoading,
    error
  }
}

