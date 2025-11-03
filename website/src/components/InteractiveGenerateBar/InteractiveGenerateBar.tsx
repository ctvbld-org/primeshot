'use client'

import { useState, useCallback, useEffect, useRef, ReactNode, useMemo } from 'react'
import { GenerateBar } from '@/components/generate/GenerateBar'
import { ScrollSectionProvider } from './ScrollSectionManager'
import { useStyleData } from '@primeshot/common'
import { useAuth } from '@primeshot/common'
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden } from '@primeshot/common/web/ui/dialog'
import { SignInForm } from '@primeshot/common/web'
import type { PanelKey } from './types'
import cssStyles from './InteractiveGenerateBar.module.css'
import { MOCK_CHARACTERS } from '@/lib/data/mockCharacters'

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
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  
  // Check if data is loaded to show the GenerateBar
  const { styles, scenes, wardrobes, colors, isLoading } = useStyleData()
  const isDataReady = !isLoading && styles.length > 0 && scenes.length > 0 && wardrobes.length > 0 && colors.length > 0
  
  // Compute style index from ID
  const selectedStyleIndex = selectedStyleId ? styles.findIndex(s => s.id === selectedStyleId) : null

  // Check auth state for create button behavior
  const { isAuthenticated } = useAuth()
  
  // Memoize mock characters - reorder based on CTA selection
  const memoizedMockCharacters = useMemo(() => {
    if (activePanel === 'cta' && selectedCharacterId) {
      // When in CTA, put the selected character first
      const laura = MOCK_CHARACTERS.find(c => c.id === selectedCharacterId)
      const others = MOCK_CHARACTERS.filter(c => c.id !== selectedCharacterId)
      return laura ? [laura, ...others] : MOCK_CHARACTERS
    }
    return MOCK_CHARACTERS
  }, [activePanel, selectedCharacterId])

  // Handle selections based on active section
  useEffect(() => {
    if (activePanel === 'cta') {
      // Find the style index
      const targetStyleId = 'a133c31e-4ff7-4bcd-906a-2f44dfaab53f'
      const styleIndex = styles.findIndex(s => s.id === targetStyleId)
      
      if (styleIndex !== -1) {
        // Set controlled state - no localStorage pollution!
        setSelectedStyleId(targetStyleId)
        setSelectedSceneId('muted-olive-green')
        setSelectedWardrobeId('stat_f_02')
        setSelectedColorId('black')
        setSelectedCharacterId('demo-laura')
      }
      
      // Close any open panels when reaching CTA
      setIsPanelOpen(false)
    } else if (activePanel === 'wardrobe') {
      // When entering wardrobe section, clear wardrobe/color to show clothes first
      setSelectedWardrobeId(null)
      setSelectedColorId(null)
      // Keep style and scene selections for context
    } else if (activePanel === null) {
      // Clear all selections when in hero section
      setSelectedStyleId(null)
      setSelectedSceneId(null)
      setSelectedWardrobeId(null)
      setSelectedColorId(null)
      setSelectedCharacterId(null)
    }
    // Otherwise (showcase sections), do nothing - selections persist
  }, [activePanel, styles])

  // Handle scroll-based positioning with RAF for smooth performance
  useEffect(() => {
    const updatePosition = () => {
      if (!barRef.current) return
      
      const heroSection = document.getElementById('section-hero')
      const charactersSection = document.getElementById('section-characters')
      const ctaSection = document.getElementById('section-cta')
      
      if (!heroSection || !charactersSection || !ctaSection) return
      
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const charactersTop = charactersSection.offsetTop
      const charactersHeight = charactersSection.offsetHeight
      const charactersMiddle = charactersTop + (charactersHeight / 2)
      
      // CTA section calculations
      const ctaTop = ctaSection.offsetTop
      const ctaHeight = ctaSection.offsetHeight
      const ctaMiddle = ctaTop + (ctaHeight / 2)
      
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
        barRef.current.style.setProperty('--bar-position', 'fixed')
        barRef.current.style.setProperty('--bar-top', 'auto')
        barRef.current.style.setProperty('--bar-bottom', '0.5rem')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%)')
      } else if (scrollY >= transitionStart && scrollY < transitionEnd) {
        // Transitioning - bar moving up
        const progress = (scrollY - transitionStart) / transitionRange
        const clampedProgress = Math.min(progress, 1)
        const currentTop = startTop - (startTop - endTop) * clampedProgress
        
        barRef.current.style.setProperty('--bar-position', 'fixed')
        barRef.current.style.setProperty('--bar-top', `${currentTop}px`)
        barRef.current.style.setProperty('--bar-bottom', 'auto')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%) translateY(-50%)')
        
      } else if (scrollY >= transitionEnd && scrollY < ctaMiddle - (windowHeight / 2)) {
        // Past characters middle but before CTA middle reaches viewport middle - bar fixed at 50% + 47px
        barRef.current.style.setProperty('--bar-position', 'fixed')
        barRef.current.style.setProperty('--bar-top', 'calc(50% + 47px)')
        barRef.current.style.setProperty('--bar-bottom', 'auto')
        barRef.current.style.setProperty('--bar-transform', 'translateX(-50%) translateY(-50%)')
      } else {
        // Past CTA middle reaching viewport middle - bar scrolls with page (absolute positioning)
        // Calculate the absolute position to maintain visual continuity
        // At transition point: scrollY = ctaMiddle - (windowHeight/2)
        // Bar visual position: scrollY + (windowHeight/2) + 47 = ctaMiddle + 47
        const absoluteTop = ctaMiddle + 47
        barRef.current.style.setProperty('--bar-position', 'absolute')
        barRef.current.style.setProperty('--bar-top', `${absoluteTop}px`)
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
  }, [isDataReady])

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
    setSelectedStyleId(styleId)
  }, [])

  const handleSceneClick = useCallback((sceneValue: string) => {
    setSelectedSceneId(sceneValue)
  }, [])

  const handleWardrobeClick = useCallback((wardrobeValue: string) => {
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
    setSelectedColorId(colorValue)
  }, [])

  const handleCharacterClick = useCallback(() => {
    // Check if user is authenticated
    if (isAuthenticated) {
      // Redirect to app's create page
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.primeshot.ai'
      window.location.href = `${appUrl}/app/upload`
    } else {
      // Open sign-in dialog (intent will be saved by useCreateCharacter)
      setIsSignInOpen(true)
    }
  }, [isAuthenticated])

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
      selectedCharacterId={selectedCharacterId}
      onSelectedCharacterChange={setSelectedCharacterId}
    >
      <div className={className}>
        {/* Scroll-animated GenerateBar - only render when data is ready */}
        {isDataReady && (
          <div 
            ref={barRef}
            className={`${cssStyles.generateBarWrapper} ${cssStyles.visible}`}
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
              onOpenSignInDialog={() => setIsSignInOpen(true)}
              hideSelections={!selectedStyleId && !selectedSceneId && !selectedWardrobeId && !selectedCharacterId}
              selectedWardrobeId={selectedWardrobeId}
              demoCharacters={memoizedMockCharacters}
              demoSelectedStyleIndex={selectedStyleIndex}
              demoSelectedScene={selectedSceneId}
              demoSelectedWardrobe={selectedWardrobeId}
              demoSelectedColor={selectedColorId}
              demoSelectedCharacter={selectedCharacterId}
            />
          </div>
        )}

        {/* Scroll sections */}
        {children}
      </div>

      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Sign In</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <SignInForm />
        </DialogContent>
      </Dialog>
    </ScrollSectionProvider>
  )
}

// Helper to map panel keys to section IDs
function getPanelSectionId(panel: PanelKey): string {
  if (!panel) return ''
  return `section-${panel}`
}

