"use client"

import React from 'react'
import styles from './OptionsPanel.module.css'

interface OptionsPanelProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function OptionsPanel({ title, onClose, children, className }: OptionsPanelProps) {
  return (
    <div className={styles.panel} role="dialog" aria-label={title}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <button className={styles.done} onClick={onClose}>Done</button>
      </div>
      <div className={`${styles.body} ${className || ''}`.trim()}>{children}</div>
    </div>
  )
}


