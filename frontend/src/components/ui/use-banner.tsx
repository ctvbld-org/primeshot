'use client'

import * as React from "react"

type BannerVariant = "default" | "success" | "destructive"

interface BannerProps {
  title?: string
  description?: string
  variant?: BannerVariant
  duration?: number
  className?: string
}

interface BannerState extends BannerProps {
  isVisible: boolean
}

interface BannerContextValue {
  banner: BannerState | null
  showBanner: (props: BannerProps) => void
  hideBanner: () => void
}

const BannerContext = React.createContext<BannerContextValue>({
  banner: null,
  showBanner: () => {},
  hideBanner: () => {},
})

export function BannerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [banner, setBanner] = React.useState<BannerState | null>(null)
  const timerRef = React.useRef<number | undefined>(undefined)

  const showBanner = React.useCallback(
    ({ title, description, variant = "default", duration = 5000, className }: BannerProps) => {
      setBanner({ title, description, variant, duration, className, isVisible: true })

      if (duration !== Infinity) {
        timerRef.current = window.setTimeout(() => {
          setBanner(prev => prev ? { ...prev, isVisible: false } : null)
          window.setTimeout(() => setBanner(null), 150) // Wait for animation
        }, duration)
      }
    },
    []
  )

  const hideBanner = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setBanner(prev => prev ? { ...prev, isVisible: false } : null)
    window.setTimeout(() => setBanner(null), 150) // Wait for animation
  }, [])

  return (
    <BannerContext.Provider
      value={{
        banner,
        showBanner,
        hideBanner,
      }}
    >
      {children}
    </BannerContext.Provider>
  )
}

export function useBanner() {
  const context = React.useContext(BannerContext)

  if (!context) {
    throw new Error("useBanner must be used within a BannerProvider")
  }

  return context
} 