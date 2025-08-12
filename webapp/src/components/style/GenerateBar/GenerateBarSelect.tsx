"use client"

import React from 'react'
import styles from './GenerateBar.module.css'

export type GenerateBarSelectProps = {
  onClick: () => void
  ariaLabel: string
  thumbnail: React.ReactNode
  label?: string
  variant?: 'labeled' | 'icon'
  overlay?: React.ReactNode
  disabled?: boolean
  className?: string
  thumbClassName?: string
}

export function GenerateBarSelect({
  onClick,
  ariaLabel,
  thumbnail,
  label,
  variant = 'labeled',
  overlay,
  disabled,
  className,
  thumbClassName,
}: GenerateBarSelectProps) {
  return (
    <button
      className={`${styles.barButton} ${className || ''}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <div className={`${styles.thumb} ${thumbClassName || ''}`.trim()} style={{ position: 'relative' }}>
        {thumbnail}
        {overlay}
      </div>
      {variant === 'labeled' && (
        <div className={styles.texts}>
          <div className={styles.primary}>{label}</div>
        </div>
      )}
    </button>
  )
}


