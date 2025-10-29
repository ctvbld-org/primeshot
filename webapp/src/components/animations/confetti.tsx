'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Use react-confetti-boom for an explosive start with natural fall
const ConfettiBoom = dynamic(() => import('react-confetti-boom'), { ssr: false }) as any

interface ConfettiProps {
  show: boolean | 'stopping'
  duration?: number
  burstMs?: number
  burstPieces?: number
  onComplete?: () => void
}

export function Confetti({ show, duration = 3000, burstMs = 2000, burstPieces = 120, onComplete }: ConfettiProps) {
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [seed, setSeed] = useState(0)

  useEffect(() => {
    if (show !== true) return
    // Single burst: trigger once by updating key/seed
    setSeed(s => s + 1)

    if (duration > 0) {
      if (stopTimerRef.current !== null) clearTimeout(stopTimerRef.current)
      stopTimerRef.current = setTimeout(() => onComplete?.(), duration)
    }
  }, [show, duration, onComplete])

  if (!show) return null

  // Render a single boom; particles fall naturally; burstMs kept for signature compatibility
  return (
    <ConfettiBoom
      key={seed}
      mode="boom"
      particleCount={burstPieces}
      spreadDeg={55}
      launchSpeed={1.5}
      opacityDeltaMultiplier={1}
      colors={["#DB66FF", "#FFC966", "#FF66C2", "#E6FF66", "#FFA666", "#A166FF", "#667AFF", "#73FF66", "#A3FF66", "#FF7366", "#FF6696", "#66FFDB"]}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 52 }}
    />
  )
}