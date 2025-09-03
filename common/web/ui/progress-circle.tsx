import React from 'react'

interface ProgressCircleProps {
  percentage: number // 0-100
  size?: number // px
  strokeWidth?: number // px
  trackColor?: string
  color?: string
  className?: string
  /**
   * Visual direction of progress rendering.
   * - 'fill' (default): 0% renders empty, 100% renders full.
   * - 'drain': 0% renders full, 100% renders empty.
   */
  direction?: 'fill' | 'drain'
  /**
   * Sweep direction. When true, progress advances clockwise from 12 o'clock.
   * Defaults to false to preserve existing counter-clockwise behavior.
   */
  clockwise?: boolean
}

function cleanPercentage(percentage: number) {
  const n = Number(percentage)
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 100) return 100
  return n
}

export function ProgressCircle({ percentage, size = 36, strokeWidth = 2, trackColor = 'transparent', color = '#2ADED8', className, direction = 'fill', clockwise = false }: ProgressCircleProps) {
  const pct = cleanPercentage(percentage)
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circ = 2 * Math.PI * radius
  // Default 'fill': larger percentage => smaller dash offset => fuller ring
  // 'drain': larger percentage => larger dash offset => emptier ring
  const strokePct = direction === 'drain'
    ? (pct * circ) / 100
    : ((100 - pct) * circ) / 100
  return (
    <svg width={size} height={size} className={className} style={{ transform: clockwise ? 'rotateZ(270deg)' : 'rotateZ(270deg) rotateX(180deg)' }}>
      <circle r={radius} cx={center} cy={center} stroke={trackColor} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={0} fill="transparent" />
      <circle r={radius} cx={center} cy={center} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={strokePct} fill="transparent" strokeLinecap="round" />
    </svg>
  )
}

export default ProgressCircle


