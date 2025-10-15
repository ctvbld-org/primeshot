import { useState, useEffect } from 'react'

// Extend Window interface to include Rewardful types
declare global {
  interface Window {
    Rewardful?: {
      referral?: string
    }
    rewardful?: (event: string, callback: () => void) => void
  }
}

/**
 * Hook to capture Rewardful referral ID
 * Returns the referral ID from the Rewardful object if available
 */
export function useRewardful() {
  const [referralId, setReferralId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if Rewardful is loaded and ready
    if (typeof window === 'undefined') return

    const checkRewardful = () => {
      if (window.Rewardful?.referral) {
        setReferralId(window.Rewardful.referral)
        setIsReady(true)
      } else {
        setIsReady(true)
      }
    }

    // Try to get referral ID immediately
    checkRewardful()

    // Also listen for Rewardful ready event
    if (window.rewardful) {
      window.rewardful('ready', () => {
        checkRewardful()
      })
    }

    // Fallback: check again after a short delay
    const timeout = setTimeout(checkRewardful, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return { referralId, isReady }
}

