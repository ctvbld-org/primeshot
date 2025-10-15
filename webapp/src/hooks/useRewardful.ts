import { useState, useEffect } from 'react'

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
      // @ts-ignore - Rewardful is loaded via external script
      if (window.Rewardful && window.Rewardful.referral) {
        // @ts-ignore
        setReferralId(window.Rewardful.referral)
        setIsReady(true)
      } else {
        setIsReady(true)
      }
    }

    // Try to get referral ID immediately
    checkRewardful()

    // Also listen for Rewardful ready event
    // @ts-ignore
    if (window.rewardful) {
      // @ts-ignore
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

