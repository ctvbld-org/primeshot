export interface StyleSelections {
  background: string | null
  clothing: string | null
  clothingColor: string | null
}

const STYLE_SELECTIONS_KEY = 'primeshot_style_selections'
const SELECTED_STYLE_INDEX_KEY = 'primeshot_selected_style_index'

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
 * Get stored selected style index
 */
export function getStoredSelectedStyleIndex(): number | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const stored = localStorage.getItem(SELECTED_STYLE_INDEX_KEY)
    return stored ? parseInt(stored, 10) : null
  } catch (error) {
    console.error('Error reading selected style index from localStorage:', error)
    return null
  }
}

/**
 * Store selected style index
 */
export function storeSelectedStyleIndex(styleIndex: number): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    localStorage.setItem(SELECTED_STYLE_INDEX_KEY, styleIndex.toString())
  } catch (error) {
    console.error('Error storing selected style index to localStorage:', error)
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

