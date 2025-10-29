'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'
import { useScrollSection } from './ScrollSectionManager'
import styles from './ShowcaseSection.module.css'

interface StickyShowcaseSectionProps {
  children: ReactNode
  scrollingContent?: ReactNode
  className?: string
  panelId: string
  isFirst?: boolean
}

export function StickyShowcaseSection({ 
  children, 
  scrollingContent,
  className, 
  panelId, 
  isFirst 
}: StickyShowcaseSectionProps) {
  const { activePanel } = useScrollSection()
  const isVisible = activePanel === panelId
  const [shouldBeFixed, setShouldBeFixed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFirst) {
      // All sections except first are always fixed
      setShouldBeFixed(true)
      return
    }

    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const viewportMiddle = window.innerHeight / 2
      const sectionMiddle = rect.top + (rect.height / 2)

      // First section becomes fixed when its middle reaches or passes viewport middle
      setShouldBeFixed(sectionMiddle <= viewportMiddle)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isFirst])

  return (
    <div ref={containerRef} className={className}>
      {/* Fixed content at viewport middle */}
      <div 
        className={`${shouldBeFixed ? styles.fixedContent : styles.scrollingContent} ${isVisible ? styles.visible : ''}`}
        data-section={panelId}
      >
        {children}
      </div>
      
      {/* Optional scrolling content that flows with document */}
      {scrollingContent && (
        <div className={styles.scrollingElements}>
          {scrollingContent}
        </div>
      )}
    </div>
  )
}

