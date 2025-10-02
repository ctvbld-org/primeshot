'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Style } from '@/types/styles'
import { getStoredSelectedStyleIndex, storeSelectedStyleIndex, storeStyleSelections, type StyleSelections } from '@/lib/utils/style-storage'
import { useStylesFromContext, useWardrobesFromContext } from './style-data-context'

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
  // Initialize from localStorage to ensure consumers start at the saved index
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number>(() => getStoredSelectedStyleIndex() ?? 0)
  const [stylesData, setStylesData] = useState<any[]>([])

  // Fetch style configs to validate URL params - now using centralized context
  const { data: styleConfigs = [] } = useStylesFromContext()
  const { data: allWardrobes = [] } = useWardrobesFromContext()

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

    const normalize = (str: string | null) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const styleIndex = styleConfigs.findIndex((s) => {
      // Match by exact id or by slugified name to support links like ?style=studiopro
      return s.id === styleParam || normalize(s.name) === normalize(styleParam)
    })
    if (styleIndex === -1) {
      // Unknown style id
      urlInitRef.current = true
      return
    }

    // Apply style selection
    setSelectedStyleIndex(styleIndex)
    storeSelectedStyleIndex(styleIndex)

    const selectedStyle = styleConfigs[styleIndex]

    // Build case-insensitive lookup helpers for style-available arrays
    const findCanonical = (arr: string[] | undefined, value: string | null) => {
      if (!value || !Array.isArray(arr)) return null
      const lower = value.toLowerCase()
      return arr.find(v => String(v).toLowerCase() === lower) || null
    }

    // Optional option params
    const sceneParam = params.get('scene')
    const wardrobeParam = params.get('wardrobe')
    const colorParam = params.get('color')

    // If we need wardrobe catalog to validate but it's not loaded yet, wait
    if (
      wardrobeParam &&
      Array.isArray(selectedStyle.available_wardrobes) &&
      !selectedStyle.available_wardrobes.includes(wardrobeParam) &&
      (!allWardrobes || allWardrobes.length === 0)
    ) {
      return // will rerun when allWardrobes changes
    }

    const newSelections: Partial<StyleSelections> = {}

    if (sceneParam) {
      const canonical = findCanonical(selectedStyle.available_scenes, sceneParam)
      if (canonical) newSelections.scene = canonical
    }

    if (wardrobeParam) {
      // Normalize to catalog value even if URL passed an id or different casing
      const list = Array.isArray(allWardrobes) ? (allWardrobes as any[]) : []
      const lower = wardrobeParam.toLowerCase()
      const byValue = list.find(w => String(w?.value || '').toLowerCase() === lower) || null
      const byId = list.find(w => w?.id === wardrobeParam) || null
      const wardrobeValueToStore = byValue?.value || byId?.value || findCanonical(selectedStyle.available_wardrobes, wardrobeParam) || wardrobeParam

      // Map style's available_wardrobes to values (supports either ids or values in DB), compare case-insensitively
      const availableValues = Array.isArray(selectedStyle.available_wardrobes)
        ? selectedStyle.available_wardrobes.map((k: string) => {
            const m = list.find(w => w?.id === k || String(w?.value || '').toLowerCase() === String(k).toLowerCase())
            return m?.value || k
          })
        : []

      const inStyle = availableValues.map(v => String(v).toLowerCase()).includes(String(wardrobeValueToStore).toLowerCase())
      const inCatalog = !!(byValue || byId)
      if (inStyle || inCatalog) {
        newSelections.wardrobe = wardrobeValueToStore
      }
    }

    if (colorParam) {
      const canonical = findCanonical(selectedStyle.available_colors, colorParam)
      if (canonical) newSelections.color = canonical
    }

    if (Object.keys(newSelections).length > 0) {
      storeStyleSelections(selectedStyle.id, newSelections)
      try { window.dispatchEvent(new CustomEvent('style-selections-updated', { detail: { styleId: selectedStyle.id } })) } catch {}
    }

    urlInitRef.current = true
  }, [styleConfigs, allWardrobes])

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