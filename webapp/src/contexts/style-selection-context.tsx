'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Style } from '@/types/styles'
import { storeSelectedStyleIndex, storeStyleSelections, type StyleSelections } from '@/lib/utils/style-storage'
import { useStyleConfigs } from '@/hooks/useConfig'

interface StyleSelectionContextType {
  selectedStyleId: string | null
  selectedStyleIndex: number
  setSelectedStyleId: (styleId: string | null) => void
  setSelectedStyleIndex: (index: number) => void
  stylesData: Style[]  
  setStylesData: (styles: Style[]) => void  
}

const StyleSelectionContext = createContext<StyleSelectionContextType | null>(null)

export function useStyleSelection() {
  const context = useContext(StyleSelectionContext)
  if (!context) {
    throw new Error('useStyleSelection must be used within a StyleSelectionProvider')
  }
  return context
}

export function StyleSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0)
  const [stylesData, setStylesData] = useState<any[]>([])

  // Fetch style configs to validate URL params
  const { data: styleConfigs = [] } = useStyleConfigs()

  // Ensure we only initialise from URL once
  const urlInitRef = useRef(false)

  // One-time URL parameter initialisation
  useEffect(() => {
    if (urlInitRef.current) return
    if (typeof window === 'undefined') return // SSR guard
    if (styleConfigs.length === 0) return // Wait until configs are ready

    const params = new URLSearchParams(window.location.search)
    const styleParam = params.get('style')

    if (!styleParam) {
      urlInitRef.current = true
      return
    }

    const styleIndex = styleConfigs.findIndex((s) => s.id === styleParam)
    if (styleIndex === -1) {
      // Unknown style id
      urlInitRef.current = true
      return
    }

    // Apply style selection
    setSelectedStyleIndex(styleIndex)
    storeSelectedStyleIndex(styleIndex)

    const selectedStyle = styleConfigs[styleIndex]

    // Optional option params
    const sceneParam = params.get('scene')
    const wardrobeParam = params.get('wardrobe')
    const colorParam = params.get('color')

    const newSelections: Partial<StyleSelections> = {}

    if (
      sceneParam &&
      Array.isArray(selectedStyle.available_backgrounds) &&
      selectedStyle.available_backgrounds.includes(sceneParam)
    ) {
      newSelections.background = sceneParam
    }

    if (
      wardrobeParam &&
      Array.isArray(selectedStyle.available_clothing) &&
      selectedStyle.available_clothing.includes(wardrobeParam)
    ) {
      newSelections.clothing = wardrobeParam
    }

    if (
      colorParam &&
      Array.isArray(selectedStyle.available_clothing_colors) &&
      selectedStyle.available_clothing_colors.includes(colorParam)
    ) {
      newSelections.clothingColor = colorParam
    }

    if (Object.keys(newSelections).length > 0) {
      storeStyleSelections(selectedStyle.id, newSelections)
    }

    urlInitRef.current = true
  }, [styleConfigs])

  // Update selectedStyleId when index changes
  useEffect(() => {
    if (stylesData.length > 0 && selectedStyleIndex >= 0 && selectedStyleIndex < stylesData.length) {
      setSelectedStyleId(stylesData[selectedStyleIndex].id)
    }
  }, [selectedStyleIndex, stylesData])

  return (
    <StyleSelectionContext.Provider value={{
      selectedStyleId,
      selectedStyleIndex,
      setSelectedStyleId,
      setSelectedStyleIndex,
      stylesData,
      setStylesData
    }}>
      {children}
    </StyleSelectionContext.Provider>
  )
}