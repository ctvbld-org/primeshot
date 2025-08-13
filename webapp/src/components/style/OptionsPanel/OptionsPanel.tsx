"use client"

import React from 'react'
import styles from './OptionsPanel.module.css'

interface OptionsPanelProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  showDone?: boolean
}

export function OptionsPanel({ title, onClose, children, className, showDone = false }: OptionsPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const panelElement = panelRef.current
      if (!panelElement) return
      const target = event.target as Node | null
      if (target && !panelElement.contains(target)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label={title}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {showDone && (
          <button className={styles.done} onClick={onClose}>Done</button>
        )}
      </div>
      <div className={`${styles.body} ${className || ''}`.trim()}>{children}</div>
    </div>
  )
}


