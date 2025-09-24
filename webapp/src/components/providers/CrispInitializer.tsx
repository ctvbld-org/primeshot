'use client'

import { useEffect } from 'react'

/**
 * Initializes Crisp on the client only.
 * Uses dynamic import to avoid evaluating the SDK during SSR.
 */
export function CrispInitializer() {
  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
    if (!websiteId) return

    let mounted = true

    import('crisp-sdk-web')
      .then(({ Crisp }) => {
        if (!mounted) return
        try {
          Crisp.configure(websiteId)
        } catch {
          // swallow to avoid breaking the app if Crisp fails
        }
      })
      .catch(() => {
        // ignore import errors silently
      })

    return () => {
      mounted = false
    }
  }, [])

  return null
}


