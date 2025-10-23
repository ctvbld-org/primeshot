'use client'

import { useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { GenerateBar } from '@/../../webapp/src/components/generate/GenerateBar'
import { ScrollSectionProvider } from './ScrollSectionManager'
import { useStyleData } from '@primeshot/common'
import type { PanelKey } from './types'
import cssStyles from './InteractiveGenerateBar.module.css'

interface InteractiveGenerateBarProps {
  children: ReactNode
  className?: string
}

export function InteractiveGenerateBar({ children, className }: InteractiveGenerateBarProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string | null>(null)
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  
  // Check if data is loaded to show the GenerateBar
  const { styles, scenes, wardrobes, colors, isLoading } = useStyleData()
  const isDataReady = !isLoading && styles.length > 0 && scenes.length > 0 && wardrobes.length > 0 && colors.length > 0

  // Reset wardrobe selection when leaving wardrobe panel
  useEffect(() => {
    if (activePanel !== 'wardrobe' && selectedWardrobeId) {
      setSelectedWardrobeId(null)
    }
  }, [activePanel, selectedWardrobeId])

  // Handle scroll-based positioning with RAF for smooth performance
  useEffect(() => {
    const updatePosition = () => {
      if (!barRef.current) return
      
      const heroSection = document.getElementById('section-hero')
      const charactersSection = document.getElementById('section-characters')
      
      if (!heroSection || !charactersSection) return
      
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const charactersTop = charactersSection.offsetTop
      const charactersHeight = charactersSection.offsetHeight
      const charactersMiddle = charactersTop + (charactersHeight / 2)
      
      // Calculate transition range
      // Start: when MIDDLE of characters section reaches BOTTOM of viewport
      // End: when MIDDLE of characters section reaches MIDDLE of viewport
      const transitionStart = charactersMiddle - windowHeight
      const transitionEnd = charactersMiddle - (windowHeight / 2)
      const transitionRange = transitionEnd - transitionStart
      
      // Bar position calculation
      const bottomOffset = 44 // 2rem
      const startTop = windowHeight - bottomOffset
      const endTop = windowHeight * 0.5 + 47 // Stop 90px before middle
      
      if (scrollY < transitionStart) {
        // In hero section - bar at bottom
        barRef.current.style.setProperty('--bar-top', 'auto')
        barRef.current.style.setProperty('--bar-bottom', '0.5rem')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%)')
      } else if (scrollY >= transitionStart && scrollY < transitionEnd) {
        // Transitioning - bar moving up
        const progress = (scrollY - transitionStart) / transitionRange
        const clampedProgress = Math.min(progress, 1)
        const currentTop = startTop - (startTop - endTop) * clampedProgress
        
        barRef.current.style.setProperty('--bar-top', `${currentTop}px`)
        barRef.current.style.setProperty('--bar-bottom', 'auto')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%) translateY(-50%)')
        
      } else {
        // Past characters middle - bar fixed at 50% + 90px
        barRef.current.style.setProperty('--bar-top', 'calc(50% + 47px)')
        barRef.current.style.setProperty('--bar-bottom', 'auto')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%) translateY(-50%)')
      }
    }
    
    const handleScroll = () => {
      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      
      // Schedule update for next frame
      rafRef.current = requestAnimationFrame(updatePosition)
    }
    
    // Initial position
    updatePosition()
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [activePanel])

  // Handle panel changes from scroll or GenerateBar clicks
  const handlePanelChange = useCallback((panel: PanelKey) => {
    setActivePanel(panel)
  }, [])

  // Handle panel toggle from GenerateBar
  const handlePanelToggle = useCallback((open: boolean) => {
    setIsPanelOpen(open)
  }, [])

  // Custom handlers for demo mode item clicks
  const handleStyleClick = useCallback((styleId: string) => {
    // In demo mode, update the selected style to show its images
    console.log('Style clicked:', styleId)
    setSelectedStyleId(styleId)
  }, [])

  const handleSceneClick = useCallback((sceneValue: string) => {
    // In demo mode, update the selected scene to trigger re-randomization
    console.log('Scene clicked:', sceneValue)
    setSelectedSceneId(sceneValue)
  }, [])

  const handleWardrobeClick = useCallback((wardrobeValue: string) => {
    // In demo mode, wardrobe click stores selection AND keeps panel open to show colors
    console.log('Wardrobe clicked:', wardrobeValue)
    
    // Empty string means "back" button was clicked - clear selection
    if (wardrobeValue === '') {
      setSelectedWardrobeId(null)
      return
    }
    
    setSelectedWardrobeId(wardrobeValue)
    // Ensure panel stays open on wardrobe panel to show colors
    setActivePanel('wardrobe')
    setIsPanelOpen(true)
  }, [])

  const handleColorClick = useCallback((colorValue: string) => {
    // In demo mode, color click triggers random image re-shuffle
    console.log('Color clicked:', colorValue)
    setSelectedColorId(colorValue)
  }, [])

  const handleCharacterClick = useCallback(() => {
    console.log('Character/Create clicked - redirecting to signup')
    // Redirect to signup for character creation
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signup'
    }
  }, [])

  // Scroll to section when panel button is clicked in GenerateBar
  const handleActivePanelChange = useCallback((panel: PanelKey) => {
    if (panel && typeof window !== 'undefined') {
      const sectionId = getPanelSectionId(panel)
      const element = document.getElementById(sectionId)
      
      if (element) {
        const headerHeight = 0
        const elementTop = element.offsetTop - headerHeight
        const elementHeight = element.offsetHeight
        const viewportHeight = window.innerHeight
        
        // Calculate position to center the element in viewport
        const scrollPosition = elementTop - (viewportHeight / 2) + (elementHeight / 2)
        
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        })
      }
    }
  }, [])

  return (
    <ScrollSectionProvider 
      onPanelChange={handlePanelChange} 
      activePanel={activePanel} 
      isPanelOpen={isPanelOpen}
      selectedStyleId={selectedStyleId}
      onSelectedStyleChange={setSelectedStyleId}
      selectedSceneId={selectedSceneId}
      onSelectedSceneChange={setSelectedSceneId}
      selectedWardrobeId={selectedWardrobeId}
      onSelectedWardrobeChange={setSelectedWardrobeId}
      selectedColorId={selectedColorId}
      onSelectedColorChange={setSelectedColorId}
    >
      <div className={className}>
        {/* Scroll-animated GenerateBar */}
        <div 
          ref={barRef}
          className={`fixed left-1/2 z-50 w-[600px] px-2 max-w-full ${cssStyles.generateBarWrapper} ${isDataReady ? cssStyles.visible : ''}`}
        >
          <GenerateBar
            emblaApi={null}
            activePanel={activePanel}
            onActivePanelChange={handleActivePanelChange}
            onPanelToggle={handlePanelToggle}
            mode="demo"
            className={cssStyles.interactiveBar}
            onStyleClick={handleStyleClick}
            onSceneClick={handleSceneClick}
            onWardrobeClick={handleWardrobeClick}
            onColorClick={handleColorClick}
            onCharacterClick={handleCharacterClick}
            hideSelections={activePanel !== 'cta' && !selectedWardrobeId}
            selectedWardrobeId={selectedWardrobeId}
          />
        </div>

        {/* Scroll sections */}
        {children}
      </div>
    </ScrollSectionProvider>
  )
}

// Helper to map panel keys to section IDs
function getPanelSectionId(panel: PanelKey): string {
  if (!panel) return ''
  return `section-${panel}`
}

