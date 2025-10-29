'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { makeCloudfrontLoader } from '@/lib/utils/cloudfrontLoader'
import { useTranslation } from 'react-i18next'
import showcaseStyles from './ShowcaseSection.module.css'
import styles from './HeroGrid.module.css'

const cloudfrontLoader = makeCloudfrontLoader('website-images')

// Custom comparison slider component
interface CompareSliderProps {
  beforeImage: string
  afterImage: string
  sliderPosition: number
  showHandle?: boolean
  isActive?: boolean
  direction?: 'horizontal' | 'vertical'
  entryEdge?: 'left' | 'right' | 'top' | 'bottom' | null
}

function CompareSlider({ 
  beforeImage, 
  afterImage, 
  sliderPosition, 
  showHandle = true, 
  isActive = false,
  direction = 'horizontal',
  entryEdge = null
}: CompareSliderProps) {
  // Determine clip-path based on entry edge
  // We're clipping the AFTER image to reveal BEFORE underneath
  let clipPath = 'inset(0 0 0 0)' // Default: show full after image
  let sliderStyle: React.CSSProperties = {}
  
  if (isActive && entryEdge) {
    switch (entryEdge) {
      case 'left':
        // Reveal from left: clip left side progressively
        clipPath = `inset(0 0 0 ${sliderPosition}%)`
        sliderStyle = { left: `${sliderPosition}%`, top: 0, bottom: 0, width: '2px', height: 'auto' }
        break
      case 'right':
        // Reveal from right: for desktop, position goes 100→0; for mobile we invert it before calling
        clipPath = `inset(0 ${100 - sliderPosition}% 0 0)`
        sliderStyle = { right: `${100 - sliderPosition}%`, top: 0, bottom: 0, width: '2px', height: 'auto' }
        break
      case 'top':
        // Reveal from top: clip top side progressively
        clipPath = `inset(${sliderPosition}% 0 0 0)`
        sliderStyle = { top: `${sliderPosition}%`, left: 0, right: 0, height: '2px', width: 'auto' }
        break
      case 'bottom':
        // Reveal from bottom: for desktop, position goes 100→0; for mobile we invert it before calling
        clipPath = `inset(0 0 ${100 - sliderPosition}% 0)`
        sliderStyle = { bottom: `${100 - sliderPosition}%`, left: 0, right: 0, height: '2px', width: 'auto' }
        break
    }
  } else {
    // When not active, show full after image
    clipPath = 'inset(0 0 0 0)'
  }
  
  const isVertical = entryEdge === 'top' || entryEdge === 'bottom'
  
  return (
    <div className={`${styles.compareContainer} ${!isActive ? styles.compareInactive : ''} ${isVertical ? styles.vertical : ''}`}>
      {/* Before image (bottom layer - revealed as after disappears) */}
      <Image
        src={beforeImage}
        alt="Before"
        fill
        className={styles.compareImage}
        loader={cloudfrontLoader}
      />
      {/* After image (top layer - disappears on swipe to reveal before) */}
      <div 
        className={styles.compareAfter}
        style={{ clipPath }}
      >
        <Image
          src={afterImage}
          alt="After"
          fill
          className={styles.compareImage}
          loader={cloudfrontLoader}
        />
      </div>
      {/* Slider line and handle */}
      {showHandle && (
        <div 
          className={styles.compareSlider}
          style={sliderStyle}
        >
          <div className={styles.compareHandle} />
        </div>
      )}
    </div>
  )
}

export function HeroGrid() {
  const { t } = useTranslation('homepage')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [desktopSliderPosition, setDesktopSliderPosition] = useState<number>(50)
  const [entryEdge, setEntryEdge] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null)
  const [mobileSliderPosition, setMobileSliderPosition] = useState<number>(0)
  const [touchedIndex, setTouchedIndex] = useState<number | null>(null)
  const [mobileTouchPosition, setMobileTouchPosition] = useState<number>(0)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [dynamicEntryEdge, setDynamicEntryEdge] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstMove = useRef<boolean>(true)
  const isFirstTouch = useRef<boolean>(true)
  
  // Show header on mount
  useEffect(() => {
    setHeaderVisible(true)
  }, [])

  const gridImages = [
    { 
      id: 1, 
      hasComparison: true,
      afterImage: 'explore/studiopro/20-w960.webp',
      beforeImage: 'homepage/hero-compare-2-w960.webp'
    },
    { 
      id: 2, 
      hasComparison: false, 
      featured: true 
    },
    { 
      id: 3, 
      hasComparison: true,
      afterImage: 'homepage/primeshot-shoot-025-img-01-w960.webp',
      beforeImage: 'homepage/selfie_13-w960.webp'
    },
    { 
      id: 4, 
      hasComparison: true,
      afterImage: 'homepage/primeshot-shoot-019-img-01-w960.webp',
      beforeImage: 'homepage/selfie_7-w960.webp'
    },
    { 
      id: 5, 
      hasComparison: true,
      afterImage: 'homepage/primeshot-c11d626a-img-01-w960.webp',
      beforeImage: 'homepage/img_1188-w960.webp'
    },
  ]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100
    
    // On first move after entering, determine which edge they entered from
    if (hoveredIndex !== index || isFirstMove.current) {
      setHoveredIndex(index)
      isFirstMove.current = false
      
      // Calculate distances to each edge
      const distanceToLeft = xPercent
      const distanceToRight = 100 - xPercent
      const distanceToTop = yPercent
      const distanceToBottom = 100 - yPercent
      
      // Find closest edge
      const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
      
      if (minDistance === distanceToLeft) {
        setEntryEdge('left')
        setDesktopSliderPosition(0)
      } else if (minDistance === distanceToRight) {
        setEntryEdge('right')
        setDesktopSliderPosition(100)
      } else if (minDistance === distanceToTop) {
        setEntryEdge('top')
        setDesktopSliderPosition(0)
      } else {
        setEntryEdge('bottom')
        setDesktopSliderPosition(100)
      }
    } else {
      // Normal tracking based on entry edge
      if (entryEdge === 'left' || entryEdge === 'right') {
        setDesktopSliderPosition(Math.max(0, Math.min(100, xPercent)))
      } else {
        setDesktopSliderPosition(Math.max(0, Math.min(100, yPercent)))
      }
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setEntryEdge(null)
    isFirstMove.current = true
  }

  // Mobile touch handlers - detect direction like desktop
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    // Store initial touch position
    setTouchStartPos({ x, y })
    setTouchedIndex(index)
    setDynamicEntryEdge(null) // Will be determined on first move
    setMobileTouchPosition(0)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    if (touchedIndex !== index || !touchStartPos) return
    
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    const xPercent = (x / rect.width) * 100
    const yPercent = (y / rect.height) * 100
    
    // Determine entry edge from initial touch position (first move only)
    if (!dynamicEntryEdge) {
      const distanceToLeft = touchStartPos.x
      const distanceToRight = rect.width - touchStartPos.x
      const distanceToTop = touchStartPos.y
      const distanceToBottom = rect.height - touchStartPos.y
      
      const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom)
      
      let edge: 'left' | 'right' | 'top' | 'bottom'
      if (minDistance === distanceToLeft) {
        edge = 'left'
      } else if (minDistance === distanceToRight) {
        edge = 'right'
      } else if (minDistance === distanceToTop) {
        edge = 'top'
      } else {
        edge = 'bottom'
      }
      
      setDynamicEntryEdge(edge)
      setEntryEdge(edge)
    }
    
    // Calculate position based on detected entry edge
    if (dynamicEntryEdge === 'left' || dynamicEntryEdge === 'right') {
      setMobileTouchPosition(Math.max(0, Math.min(100, xPercent)))
    } else {
      setMobileTouchPosition(Math.max(0, Math.min(100, yPercent)))
    }
  }

  const handleTouchEnd = () => {
    setTouchedIndex(null)
    setEntryEdge(null)
    setDynamicEntryEdge(null)
    setTouchStartPos(null)
    isFirstTouch.current = true
  }

  // Scroll-based slider animation for mobile
  useEffect(() => {
    // Track the initial position to calculate relative scroll
    let hasInitialized = false
    let initialTop: number | null = null
    
    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Capture initial position on first call
      if (!hasInitialized) {
        initialTop = rect.top
        hasInitialized = true
        setMobileSliderPosition(0) // Ensure we start at 0
        return
      }
      
      if (initialTop === null) return
      
      // Calculate how much we've scrolled from initial position
      const scrolledAmount = initialTop - rect.top
      
      // Start revealing after scrolling 50px
      // Complete reveal at 300px of scroll
      const scrollStart = 50
      const scrollEnd = 600
      
      let scrollProgress = 0
      
      if (scrolledAmount < scrollStart) {
        scrollProgress = 0
      } else if (scrolledAmount >= scrollStart && scrolledAmount < scrollEnd) {
        scrollProgress = (scrolledAmount - scrollStart) / (scrollEnd - scrollStart)
        scrollProgress = Math.max(0, Math.min(1, scrollProgress))
      } else {
        scrollProgress = 1
      }
      
      // Base reveal range: 0% → 100%
      const newPosition = scrollProgress * 100
      setMobileSliderPosition(newPosition)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <p className={`${showcaseStyles.subtitle} ${showcaseStyles.headerSubtitle} ${headerVisible ? showcaseStyles.visible : ''}`}>
          {t('grid.tagline')}
        </p>
        <h2 className={`${showcaseStyles.title} ${showcaseStyles.headerTitle} ${headerVisible ? showcaseStyles.visible : ''}`}>
          {t('grid.title')}
        </h2>
      </div>
      {/* Desktop Grid - 1 row × 5 columns */}
      <div className={styles.desktopGrid}>
        {gridImages.map((img, index) => (
          <div
            key={img.id}
            className={img.featured ? styles.featuredItem : styles.gridItem}
            onMouseMove={!img.featured ? (e) => handleMouseMove(e, index) : undefined}
            onMouseLeave={handleMouseLeave}
          >
            {img.featured ? (
              <div className={styles.imageContainer}>
                <Image
                  src="homepage/8.webp"
                  alt="Featured 4K quality"
                  fill
                  className={styles.featuredImage}
                  loader={cloudfrontLoader}
                />
                <div className={styles.badge}>
                  {t('grid.badge')}
                </div>
              </div>
            ) : (
              <CompareSlider
                beforeImage={img.beforeImage || 'landing-page-10-w1280.webp'}
                afterImage={img.afterImage || 'landing-page-10-w1280.webp'}
                sliderPosition={hoveredIndex === index ? desktopSliderPosition : (entryEdge === 'right' || entryEdge === 'bottom' ? 100 : 0)}
                showHandle={hoveredIndex === index}
                isActive={hoveredIndex === index}
                entryEdge={hoveredIndex === index ? entryEdge : null}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Grid - 2 rows × 2 columns */}
      <div className={styles.mobileGrid}>
        {gridImages.slice(0, 4).map((img, index) => {
          // Define fixed entry edges for scroll-based reveal
          let scrollEntryEdge: 'left' | 'right' | 'bottom' = 'left'
          if (index === 2) scrollEntryEdge = 'bottom' // Image 3 (index 2)
          if (index === 3) scrollEntryEdge = 'right'  // Image 4 (index 3)
          
          // Define reveal speed multipliers for each image
          const speedMultipliers = [
            2.5,  // Image 1: much faster
            1.0,  // Image 2: normal speed
            1.8,  // Image 3: medium-fast
            1.6   // Image 4: medium-fast
          ]
          
          // Use touch position if touched, otherwise use scroll position with speed multiplier
          const rawScrollPosition = Math.min(100, mobileSliderPosition * speedMultipliers[index])
          
          // For scroll, invert position for right/bottom entries to match clip-path expectations
          const scrollPosition = (scrollEntryEdge === 'right' || scrollEntryEdge === 'bottom')
            ? (100 - rawScrollPosition)
            : rawScrollPosition
          
          // Use dynamically detected entry edge for touch, or fixed edge for scroll
          const effectivePosition = touchedIndex === index 
            ? mobileTouchPosition
            : scrollPosition
          
          const isTouching = touchedIndex === index
          const activeEntryEdge = touchedIndex === index ? dynamicEntryEdge : scrollEntryEdge
          
          return (
            <div
              key={img.id}
              className={img.featured ? styles.featuredItem : styles.gridItem}
              onTouchStart={!img.featured ? (e) => handleTouchStart(e, index) : undefined}
              onTouchMove={!img.featured ? (e) => handleTouchMove(e, index) : undefined}
              onTouchEnd={!img.featured ? handleTouchEnd : undefined}
            >
              {img.featured ? (
                <div className={styles.imageContainer}>
                  <Image
                    src="homepage/8.webp"
                    alt="Featured 4K quality"
                    fill
                    className={styles.featuredImage}
                    loader={cloudfrontLoader}
                  />
                  <div className={styles.badge}>
                    {t('grid.badge')}
                  </div>
                </div>
              ) : (
                <CompareSlider
                  beforeImage={img.beforeImage || 'landing-page-10-w1280.webp'}
                  afterImage={img.afterImage || 'landing-page-10-w1280.webp'}
                  sliderPosition={effectivePosition}
                  isActive={true}
                  entryEdge={activeEntryEdge}
                  showHandle={isTouching}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

