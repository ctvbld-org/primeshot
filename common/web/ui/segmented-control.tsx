import * as React from 'react'
import styles from './segmented-control.module.css'
import { cn } from '../../lib/utils'

type Option = { value: string | number; content?: React.ReactNode; disabled?: boolean }

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  fullWidth = true,
  size = 'md',
}: {
  options: Option[]
  value: string | number
  onChange: (v: string | number) => void
  className?: string
  fullWidth?: boolean
  size?: 'sm' | 'md'
}) {
  const count = Math.max(1, options.length)
  const idx = Math.max(0, options.findIndex(o => String(o.value) === String(value)))
  const width = `${100 / count}%`
  const transform = `translateX(${idx * 100}%)`

  return (
    <div className={cn(styles.segmented, fullWidth && styles.segmentedFull, size === 'sm' ? styles['size-sm'] : styles['size-md'], className)}>
      <div className={styles.segmentThumb} style={{ width, transform }} />
      {options.map(opt => {
        const isActive = String(value) === String(opt.value)
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={cn(styles.segment, isActive && styles.segmentActive, opt.disabled && styles.segmentDisabled)}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
          >
            {opt.content ?? String(opt.value)}
          </button>
        )
      })}
    </div>
  )
}


