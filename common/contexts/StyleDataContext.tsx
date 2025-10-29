'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Style, Scene, Wardrobe, Color } from '../types/styles'
import { createConfigApi } from '../lib/api/config'
import type { SupabaseClient } from '@supabase/supabase-js'

interface StyleDataContextValue {
  // Bulk data
  styles: Style[]
  scenes: Scene[]
  wardrobes: Wardrobe[]
  colors: Color[]
  
  // Loading states
  stylesLoading: boolean
  scenesLoading: boolean
  wardrobesLoading: boolean
  colorsLoading: boolean
  
  // Overall loading state
  isLoading: boolean
  
  // Error states
  stylesError: Error | null
  scenesError: Error | null
  wardrobesError: Error | null
  colorsError: Error | null
  
  // Helper functions to find items from bulk data
  findStyleById: (id: string) => Style | undefined
  findSceneById: (id: string) => Scene | undefined
  findSceneByValue: (value: string) => Scene | undefined
  findWardrobeById: (id: string) => Wardrobe | undefined
  findWardrobeByValue: (value: string) => Wardrobe | undefined
  findColorById: (id: string) => Color | undefined
  findColorByValue: (value: string) => Color | undefined
}

const StyleDataContext = createContext<StyleDataContextValue | null>(null)

const CACHE_KEYS = {
  styles: 'styles',
  scenes: 'scenes',
  wardrobes: 'wardrobes',
  colors: 'colors',
} as const

// Cache for 1 week since this data changes infrequently
const ONE_WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7

interface StyleDataProviderProps {
  children: ReactNode
  supabaseClient: SupabaseClient<any>
}

export function StyleDataProvider({ children, supabaseClient }: StyleDataProviderProps) {
  // Create API instance with the provided supabase client
  const api = React.useMemo(() => createConfigApi(supabaseClient), [supabaseClient])
  
  // Fetch all bulk data in parallel
  const {
    data: styles = [],
    isLoading: stylesLoading,
    error: stylesError,
  } = useQuery({
    queryKey: [CACHE_KEYS.styles],
    queryFn: api.getAllStyleConfigs,
    staleTime: ONE_WEEK_IN_MS,
  })

  const {
    data: scenes = [],
    isLoading: scenesLoading,
    error: scenesError,
  } = useQuery({
    queryKey: [CACHE_KEYS.scenes],
    queryFn: api.getScenes,
    staleTime: ONE_WEEK_IN_MS,
  })

  const {
    data: wardrobes = [],
    isLoading: wardrobesLoading,
    error: wardrobesError,
  } = useQuery({
    queryKey: [CACHE_KEYS.wardrobes],
    queryFn: api.getWardrobes,
    staleTime: ONE_WEEK_IN_MS,
  })

  const {
    data: colors = [],
    isLoading: colorsLoading,
    error: colorsError,
  } = useQuery({
    queryKey: [CACHE_KEYS.colors],
    queryFn: api.getColors,
    staleTime: ONE_WEEK_IN_MS,
  })

  // Overall loading state
  const isLoading = stylesLoading || scenesLoading || wardrobesLoading || colorsLoading

  // Helper functions to find items from bulk data
  const findStyleById = (id: string) => styles.find(style => style.id === id)
  
  const findSceneById = (id: string) => scenes.find(scene => scene.id === id)
  const findSceneByValue = (value: string) => scenes.find(scene => scene.value === value)
  
  const findWardrobeById = (id: string) => wardrobes.find(wardrobe => wardrobe.id === id)
  const findWardrobeByValue = (value: string) => wardrobes.find(wardrobe => wardrobe.value === value)
  
  const findColorById = (id: string) => colors.find(color => color.id === id)
  const findColorByValue = (value: string) => colors.find(color => color.value === value)

  const contextValue: StyleDataContextValue = {
    // Bulk data
    styles,
    scenes,
    wardrobes,
    colors,
    
    // Loading states
    stylesLoading,
    scenesLoading,
    wardrobesLoading,
    colorsLoading,
    isLoading,
    
    // Error states
    stylesError: stylesError as Error | null,
    scenesError: scenesError as Error | null,
    wardrobesError: wardrobesError as Error | null,
    colorsError: colorsError as Error | null,
    
    // Helper functions
    findStyleById,
    findSceneById,
    findSceneByValue,
    findWardrobeById,
    findWardrobeByValue,
    findColorById,
    findColorByValue,
  }

  return (
    <StyleDataContext.Provider value={contextValue}>
      {children}
    </StyleDataContext.Provider>
  )
}

export function useStyleData() {
  const context = useContext(StyleDataContext)
  if (!context) {
    throw new Error('useStyleData must be used within a StyleDataProvider')
  }
  return context
}

// Convenience hooks for backwards compatibility
export function useStylesFromContext() {
  const { styles, stylesLoading, stylesError } = useStyleData()
  return { data: styles, isLoading: stylesLoading, error: stylesError }
}

export function useScenesFromContext() {
  const { scenes, scenesLoading, scenesError } = useStyleData()
  return { data: scenes, isLoading: scenesLoading, error: scenesError }
}

export function useWardrobesFromContext() {
  const { wardrobes, wardrobesLoading, wardrobesError } = useStyleData()
  return { data: wardrobes, isLoading: wardrobesLoading, error: wardrobesError }
}

export function useColorsFromContext() {
  const { colors, colorsLoading, colorsError } = useStyleData()
  return { data: colors, isLoading: colorsLoading, error: colorsError }
}

