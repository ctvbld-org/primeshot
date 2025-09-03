import * as React from 'react'
import styles from './segmented-control.module.css'
import { cn } from '../../lib/utils'

export type Option = { value: string | number; content?: React.ReactNode; disabled?: boolean }

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  fullWidth = true,
  size = 'md',
  ariaLabel,
}: {
  options: Option[]
  value: string | number
  onChange: (v: string | number) => void
  className?: string
  fullWidth?: boolean
  size?: 'sm' | 'md'
  ariaLabel?: string
}) {
  const count = Math.max(1, options.length)
  const selectedIndex = options.findIndex(o => String(o.value) === String(value))
  const getFirstEnabled = () => options.findIndex(o => !o.disabled)
  const getLastEnabled = () => {
    for (let i = options.length - 1; i >= 0; i--) {
      if (!options[i]?.disabled) return i
    }
    return -1
  }
  const focusIndex = selectedIndex >= 0 && !options[selectedIndex]?.disabled
    ? selectedIndex
    : Math.max(0, getFirstEnabled())
  const idx = Math.max(0, selectedIndex >= 0 ? selectedIndex : 0)
  const width = `${100 / count}%`
  const transform = `translateX(${idx * 100}%)`

  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const getNextEnabled = (start: number, direction: 1 | -1) => {
    let i = start
    for (let step = 0; step < options.length; step++) {
      i = (i + direction + options.length) % options.length
      if (!options[i]?.disabled) return i
    }
    return start
  }

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const move = (dir: 1 | -1) => {
        if (!options.length) return currentIndex
        let j = currentIndex
        for (let k = 0; k < options.length; k++) {
          j = (j + dir + options.length) % options.length
          if (!options[j]?.disabled) return j
        }
        return currentIndex
      }
      let next = currentIndex
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault(); next = move(-1); break
        case 'ArrowRight':
          e.preventDefault(); next = move(1); break
        case 'Home':
          e.preventDefault(); next = options.findIndex(o => !o.disabled); break
        case 'End':
          e.preventDefault(); next = [...options].reverse().findIndex(o => !o.disabled)
          next = next === -1 ? currentIndex : options.length - 1 - next
          break
        default:
          return
      }
      if (next !== -1 && !options[next]?.disabled) onChange(options[next].value)
    },
    [options, onChange]
  )

  return (
    <div
      role="radiogroup"
      aria-orientation="horizontal"
      aria-label={ariaLabel}
      className={cn(styles.segmented, fullWidth && styles.segmentedFull, size === 'sm' ? styles['size-sm'] : styles['size-md'], className)}
    >
      {options.length > 0 && <div className={styles.segmentThumb} style={{ width, transform }} />}
      {options.map((opt, i) => {
        const isActive = String(value) === String(opt.value)
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-disabled={opt.disabled || undefined}
            tabIndex={i === focusIndex ? 0 : -1}
            ref={el => { itemRefs.current[i] = el }}
            className={cn(styles.segment, isActive && styles.segmentActive, opt.disabled && styles.segmentDisabled)}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {opt.content ?? String(opt.value)}
          </button>
        )
      })}
    </div>
  )
}


