'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Style } from '@/types/styles'

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