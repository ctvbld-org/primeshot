export interface StyleSelections {
  background: string | null
  clothing: string | null
  clothingColor: string | null
}

export interface ClothingColorSelections {
  [clothingId: string]: string
}

const STYLE_SELECTIONS_KEY = 'primeshot_style_selections'
const CLOTHING_COLOR_KEY = 'primeshot_clothing_colors'

/**
 * Check if localStorage is available (SSR-safe)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, 'test')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get stored selections for a specific style
 */
export function getStoredStyleSelections(styleId: string): StyleSelections {
  if (!isLocalStorageAvailable()) {
    return { background: null, clothing: null, clothingColor: null }
  }

  try {
    const stored = localStorage.getItem(STYLE_SELECTIONS_KEY)
    if (!stored) return { background: null, clothing: null, clothingColor: null }
    
    const allSelections = JSON.parse(stored)
    return allSelections[styleId] || { background: null, clothing: null, clothingColor: null }
  } catch (error) {
    console.error('Error reading style selections from localStorage:', error)
    return { background: null, clothing: null, clothingColor: null }
  }
}

/**
 * Store selections for a specific style
 */
export function storeStyleSelections(styleId: string, selections: Partial<StyleSelections>): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    const stored = localStorage.getItem(STYLE_SELECTIONS_KEY)
    let allSelections: Record<string, StyleSelections> = {}
    
    if (stored) {
      allSelections = JSON.parse(stored)
    }
    
    // Get current selections or default, avoiding extra localStorage read
    const currentSelections = allSelections[styleId] || { background: null, clothing: null, clothingColor: null }
    allSelections[styleId] = {
      ...currentSelections,
      ...selections
    }
    
    localStorage.setItem(STYLE_SELECTIONS_KEY, JSON.stringify(allSelections))
  } catch (error) {
    console.error('Error storing style selections to localStorage:', error)
  }
}

/**
 * Get stored color for a specific clothing item
 */
export function getStoredClothingColor(clothingId: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const stored = localStorage.getItem(CLOTHING_COLOR_KEY)
    if (!stored) return null
    
    const colorSelections: ClothingColorSelections = JSON.parse(stored)
    return colorSelections[clothingId] || null
  } catch (error) {
    console.error('Error reading clothing colors from localStorage:', error)
    return null
  }
}

/**
 * Store color for a specific clothing item
 */
export function storeClothingColor(clothingId: string, colorId: string): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const stored = localStorage.getItem(CLOTHING_COLOR_KEY)
    let colorSelections: ClothingColorSelections = {}
    
    if (stored) {
      colorSelections = JSON.parse(stored)
    }
    
    colorSelections[clothingId] = colorId
    localStorage.setItem(CLOTHING_COLOR_KEY, JSON.stringify(colorSelections))
  } catch (error) {
    console.error('Error storing clothing color to localStorage:', error)
  }
}

/**
 * Get all stored clothing color selections
 */
export function getAllStoredClothingColors(): ClothingColorSelections {
  if (!isLocalStorageAvailable()) {
    return {}
  }

  try {
    const stored = localStorage.getItem(CLOTHING_COLOR_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading all clothing colors from localStorage:', error)
    return {}
  }
}