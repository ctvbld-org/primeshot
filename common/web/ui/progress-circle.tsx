import React from 'react'

interface ProgressCircleProps {
  percentage: number // 0-100
  size?: number // px
  strokeWidth?: number // px
  trackColor?: string
  color?: string
  className?: string
}

function cleanPercentage(percentage: number) {
  const n = Number(percentage)
  if (!Number.isFinite(n) || n < 0) return 0
  if (n > 100) return 100
  return n
}

export function ProgressCircle({ percentage, size = 36, strokeWidth = 2, trackColor = 'transparent', color = '#2ADED8', className }: ProgressCircleProps) {
  const pct = cleanPercentage(percentage)
  const center = size / 2
  const radius = center - strokeWidth / 2
  const circ = 2 * Math.PI * radius
  const strokePct = ((100 - pct) * circ) / 100
  return (
    <svg width={size} height={size} className={className} style={{ transform: 'rotateZ(270deg) rotateX(180deg)' }}>
      <circle r={radius} cx={center} cy={center} stroke={trackColor} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={0} fill="transparent" />
      <circle r={radius} cx={center} cy={center} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={strokePct} fill="transparent" strokeLinecap="round" />
    </svg>
  )
}

export default ProgressCircle


