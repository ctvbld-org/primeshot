'use client'

import { createContext, useContext, ReactNode, useRef, useCallback, useEffect } from 'react'
import type { PanelKey } from './types'

interface ScrollSectionContextType {
  registerSection: (id: string, element: HTMLElement, panel: PanelKey) => void
  unregisterSection: (id: string) => void
  activePanel: PanelKey
  isPanelOpen: boolean
  selectedStyleId: string | null
  setSelectedStyleId: (styleId: string | null) => void
  selectedSceneId: string | null
  setSelectedSceneId: (sceneId: string | null) => void
  selectedWardrobeId: string | null
  setSelectedWardrobeId: (wardrobeId: string | null) => void
  selectedColorId: string | null
  setSelectedColorId: (colorId: string | null) => void
  selectedCharacterId: string | null
  setSelectedCharacterId: (characterId: string | null) => void
}

const ScrollSectionContext = createContext<ScrollSectionContextType | null>(null)

export function useScrollSection() {
  const context = useContext(ScrollSectionContext)
  if (!context) {
    throw new Error('useScrollSection must be used within ScrollSectionProvider')
  }
  return context
}

interface ScrollSectionProviderProps {
  children: ReactNode
  onPanelChange: (panel: PanelKey) => void
  activePanel: PanelKey
  isPanelOpen: boolean
  selectedStyleId: string | null
  onSelectedStyleChange: (styleId: string | null) => void
  selectedSceneId: string | null
  onSelectedSceneChange: (sceneId: string | null) => void
  selectedWardrobeId: string | null
  onSelectedWardrobeChange: (wardrobeId: string | null) => void
  selectedColorId: string | null
  onSelectedColorChange: (colorId: string | null) => void
  selectedCharacterId: string | null
  onSelectedCharacterChange: (characterId: string | null) => void
}

export function ScrollSectionProvider({ 
  children, 
  onPanelChange, 
  activePanel, 
  isPanelOpen,
  selectedStyleId,
  onSelectedStyleChange,
  selectedSceneId,
  onSelectedSceneChange,
  selectedWardrobeId,
  onSelectedWardrobeChange,
  selectedColorId,
  onSelectedColorChange,
  selectedCharacterId,
  onSelectedCharacterChange
}: ScrollSectionProviderProps) {
  const sectionsRef = useRef<Map<string, { element: HTMLElement; panel: PanelKey }>>(new Map())

  const registerSection = useCallback((id: string, element: HTMLElement, panel: PanelKey) => {
    sectionsRef.current.set(id, { element, panel })
  }, [])

  const unregisterSection = useCallback((id: string) => {
    sectionsRef.current.delete(id)
  }, [])

  // Scroll listener to determine which panel should be active
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const centerY = scrollY + viewportHeight / 2.5

      // Find the section closest to the center of the viewport
      let closestSection: { panel: PanelKey; distance: number } | null = null

      for (const [id, { element, panel }] of sectionsRef.current) {
        const rect = element.getBoundingClientRect()
        const elementCenterY = scrollY + rect.top + rect.height / 2
        const distance = Math.abs(centerY - elementCenterY)

        if (!closestSection || distance < closestSection.distance) {
          closestSection = { panel, distance }
        }
      }

      if (closestSection) {
        onPanelChange(closestSection.panel)
      }
    }

    // Don't call handleScroll immediately - let the bar render first
    // Initial check will happen on first scroll or after a short delay
    const initialTimeout = setTimeout(handleScroll, 500)
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [onPanelChange])

  return (
    <ScrollSectionContext.Provider value={{ 
      registerSection, 
      unregisterSection, 
      activePanel, 
      isPanelOpen,
      selectedStyleId,
      setSelectedStyleId: onSelectedStyleChange,
      selectedSceneId,
      setSelectedSceneId: onSelectedSceneChange,
      selectedWardrobeId,
      setSelectedWardrobeId: onSelectedWardrobeChange,
      selectedColorId,
      setSelectedColorId: onSelectedColorChange,
      selectedCharacterId,
      setSelectedCharacterId: onSelectedCharacterChange
    }}>
      {children}
    </ScrollSectionContext.Provider>
  )
}

interface ScrollSectionProps {
  id: string
  panel: PanelKey
  children: ReactNode
  className?: string
}

export function ScrollSection({ id, panel, children, className }: ScrollSectionProps) {
  const { registerSection, unregisterSection } = useScrollSection()
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (elementRef.current) {
      registerSection(id, elementRef.current, panel)
      return () => unregisterSection(id)
    }
  }, [id, panel, registerSection, unregisterSection])

  return (
    <section ref={elementRef} id={id} className={className}>
      {children}
    </section>
  )
}

