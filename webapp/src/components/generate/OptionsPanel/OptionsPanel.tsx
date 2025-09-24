"use client"

import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './OptionsPanel.module.css'
import { Icon } from '@primeshot/common/web/Icon'
import { Button } from '@primeshot/common/web/ui/button'

interface OptionsPanelProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
  showDone?: boolean
  onSearchChange?: (q: string) => void
  showSearch?: boolean
  searchValue?: string
  canPrev?: boolean
  canNext?: boolean
  onPrev?: () => void
  onNext?: () => void
  leftHeader?: React.ReactNode
}

export function OptionsPanel({ title, onClose, children, className, showDone = false, onSearchChange, showSearch = true, searchValue, canPrev, canNext, onPrev, onNext, leftHeader }: OptionsPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [query, setQuery] = React.useState('')
  const { t } = useTranslation(['generate'])

  // Keep local input in sync with parent-controlled value
  React.useEffect(() => {
    if (typeof searchValue === 'string') setQuery(searchValue)
  }, [searchValue])

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const panelElement = panelRef.current
      if (!panelElement) return
      const target = event.target as Node | null
      // Allow interactions with floating UI (e.g., popovers) rendered in a portal
      // by marking them with data-panel-keepopen on a parent element.
      const isKeepOpen = (target instanceof HTMLElement) && !!target.closest('[data-panel-keepopen]')
      if (target && !panelElement.contains(target) && !isKeepOpen) {
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
        <div className={styles.headerLeft}>
          {leftHeader}
          {showSearch && (
            <div className={styles.searchBox} role="search">
              <Icon variant="magnifier" className={styles.searchIcon} size={16} />
              <input
                className={styles.searchInput}
                placeholder={t('placeholders.find', { title: title.toLowerCase() })}
                value={typeof searchValue === 'string' ? searchValue : query}
                onChange={(e) => { setQuery(e.target.value); onSearchChange?.(e.target.value) }}
                aria-label={t('aria.search', { title })}
              />
            </div>
          )}
        </div>
        
        <div className={styles.headerRight}>
          {(onPrev || onNext) && (
            <div className={styles.navButtons} aria-label={t('aria.carouselNavigation')}>
              <button className={styles.navBtn} onClick={onPrev} disabled={!canPrev} aria-label={t('aria.previous')}>
                <Icon variant="chevronLeft" size={16} />
              </button>
              <button className={styles.navBtn} onClick={onNext} disabled={!canNext} aria-label={t('aria.next')}>
                <Icon variant="chevronRight" size={16} />
              </button>
            </div>
          )}
        {showDone && (
          <Button variant="secondary" size="sm" onClick={onClose}>{t('buttons.done')}</Button>
        )}
        </div>
      </div>
      <div className={`${styles.body} ${className || ''}`.trim()}>{children}</div>
    </div>
  )
}


