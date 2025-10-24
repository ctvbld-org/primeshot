// Stub - not used in website demo
import { ReactNode } from 'react'

interface GenerateBarSelectProps {
  onClick?: () => void
  ariaLabel?: string
  variant?: string
  thumbnail?: ReactNode
  label?: string
  isActive?: boolean
  showTrainingProgress?: boolean
  trainingProgress?: number
  disabled?: boolean
  [key: string]: any // Accept any other props
}

export function GenerateBarSelect({ children, thumbnail, label }: GenerateBarSelectProps) {
  return <div>{thumbnail}{label}{children}</div>
}
