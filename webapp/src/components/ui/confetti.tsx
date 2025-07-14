'use client'

import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useWindowSize } from '@/lib/hooks/use-window-size'

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })

interface ConfettiProps {
  show: boolean | 'stopping'
  duration?: number
  onComplete?: () => void
}

const CONFETTI_CONFIG = {
  numberOfPieces: 300,
  recycle: false,
  gravity: 0.1,
  initialVelocityY: 10,
  colors: ['#44E3C9', '#FF973C', '#C0CED8']
}

export function Confetti({ show, duration = 3000, onComplete }: ConfettiProps) {
  const { width, height } = useWindowSize()
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (show === true && duration > 0) {
      stopTimerRef.current = setTimeout(() => {
        onComplete?.()
      }, duration)
    }

    return () => {
      if (stopTimerRef.current !== null) {
        clearTimeout(stopTimerRef.current)
        stopTimerRef.current = null
      }
      if (removeTimerRef.current !== null) {
        clearTimeout(removeTimerRef.current)
        removeTimerRef.current = null
      }
    }
  }, [show, duration, onComplete])

  if (!show) return null

  return (
    <ReactConfetti
      className='z-52!'
      width={width}
      height={height}
      {...CONFETTI_CONFIG}
      recycle={show === true}
      numberOfPieces={show === 'stopping' ? 0 : CONFETTI_CONFIG.numberOfPieces}
    />
  )
}