// Stub - not used in website demo
import { ReactNode, Dispatch, SetStateAction } from 'react'

interface OptionsPanelProps {
  children?: ReactNode
  title?: string
  onClose?: () => void
  onSearchChange?: Dispatch<SetStateAction<string>>
  searchValue?: string
  canPrev?: boolean
  canNext?: boolean
  onPrev?: () => void
  onNext?: () => void
  [key: string]: any // Accept any other props
}

export function OptionsPanel({ children }: OptionsPanelProps) {
  return <>{children}</>
}
