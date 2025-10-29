"use client"

import React from 'react'
import styles from './GenerateBar.module.css'
import { Icon } from '@primeshot/common/web/Icon'

export type GenerateBarSelectProps = {
  onClick: () => void
  ariaLabel: string
  thumbnail: React.ReactNode
  label?: string
  variant?: 'labeled' | 'icon' | 'no-label' 
  overlay?: React.ReactNode
  disabled?: boolean
  error?: boolean
  className?: string
  thumbClassName?: string
}

export const GenerateBarSelect = React.forwardRef<HTMLButtonElement, GenerateBarSelectProps>(
  ({
    onClick,
    ariaLabel,
    thumbnail,
    label,
    variant = 'labeled',
    overlay,
    disabled,
    error,
    className,
    thumbClassName,
  }, ref) => {
    const noLabel = variant === 'no-label'
    const iconOnly = variant === 'icon'

    return (
      <button
        ref={ref}
        className={`${styles.barButton} ${noLabel ? styles.noLabel : ''} ${iconOnly ? styles.iconOnly : ''} ${error ? styles.selectorError : ''} ${className || ''}`.trim()}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        <div className={`${styles.thumb} ${thumbClassName || ''}`.trim()} style={{ position: 'relative' }}>
          {thumbnail}
          {overlay}
        </div>
        {variant === 'labeled' && (
          <>
            <span className={styles.text}>{label}</span>
            <Icon variant="chevronDown" size={16} className={styles.icon} />
          </>
        )}
      </button>
    )
  }
)

GenerateBarSelect.displayName = 'GenerateBarSelect'


