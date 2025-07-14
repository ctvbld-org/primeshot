import { useCurrentSubscription } from './useCurrentSubscription'

export function useSubscriptionStatus() {
  // Re-use the central subscription query so we don't duplicate network calls
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