import { create } from 'zustand'
import { StateCreator } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { StyleSettings, StylePhotographyStyle, StyleBackground, StyleClothing, StyleClothingColor, Gender } from '@/lib/types'
import { validateStyleSettings } from '@/lib/utils/style-validation'
import { getAllStyleConfigs } from '@/lib/api/config'

interface StyleState {
  settings: StyleSettings
  setBackground: (background: StyleBackground) => Promise<void>
  setClothing: (clothing: StyleClothing) => Promise<void>
  setPhotographyStyle: (style: StylePhotographyStyle) => Promise<void>
  setClothingColor: (color: StyleClothingColor) => Promise<void>
  setGender: (gender: Gender) => void
  reset: () => void
}

// Get default settings based on style configuration
const getDefaultSettings = async (photographyStyle: StylePhotographyStyle): Promise<StyleSettings> => {
  const styleConfigs = await getAllStyleConfigs()
  const styleConfig = styleConfigs.find(style => style.id === photographyStyle)
  
  return {
    photographyStyle,
    background: styleConfig?.available_backgrounds[0] || 'plain-light',
    clothing: styleConfig?.available_clothing[0] || 'shirt',
    gender: 'male',
    clothingColor: styleConfig?.available_clothing_colors?.[0] || '#FFFFFF',
  }
}

// Initial settings before loading from the database
const initialSettings: StyleSettings = {
  photographyStyle: 'studio',
  background: 'plain-light',
  clothing: 'shirt',
  gender: 'male',
  clothingColor: '#FFFFFF',
}

type StyleStore = UseBoundStore<StoreApi<StyleState>>

// Store instances cache
const stores: Record<StylePhotographyStyle, StyleStore> = {} as Record<StylePhotographyStyle, StyleStore>

export const useStyleStore = (photographyStyle: StylePhotographyStyle = 'studio') => {
  if (!stores[photographyStyle]) {
    const createStore: StateCreator<StyleState> = (set) => ({
      settings: initialSettings, // Start with initial settings, will be updated after DB fetch
      setBackground: async (background) => {
        const settings = stores[photographyStyle].getState().settings
        const newSettings = { ...settings, background }
        const { isValid, errors } = await validateStyleSettings(newSettings)
        if (!isValid) {
          console.error('Invalid style settings:', errors)
          throw new Error(errors.join(', '))
        }
        set((state) => ({
          settings: { ...state.settings, background }
        }))
      },
      setClothing: async (clothing) => {
        const settings = stores[photographyStyle].getState().settings
        const newSettings = { ...settings, clothing }
        const { isValid, errors } = await validateStyleSettings(newSettings)
        if (!isValid) {
          console.error('Invalid style settings:', errors)
          throw new Error(errors.join(', '))
        }
        set((state) => ({
          settings: { ...state.settings, clothing }
        }))
      },
      setPhotographyStyle: async (style) => {
        const settings = stores[photographyStyle].getState().settings
        const newSettings = { ...settings, photographyStyle: style }
        const { isValid, errors } = await validateStyleSettings(newSettings)
        if (!isValid) {
          console.error('Invalid style settings:', errors)
          throw new Error(errors.join(', '))
        }
        set((state) => ({
          settings: { ...state.settings, photographyStyle: style }
        }))
      },
      setClothingColor: async (clothingColor) => {
        set((state) => ({
          settings: { ...state.settings, clothingColor }
        }))
      },
      setGender: (gender) => set((state) => ({
        settings: { ...state.settings, gender }
      })),
      reset: () => {
        // Get fresh defaults when resetting
        getDefaultSettings(photographyStyle).then(defaultSettings => {
          set({ settings: defaultSettings })
        }).catch(error => {
          console.error('Error getting default settings:', error)
          // Fallback to initial settings if there's an error
          set({ settings: { ...initialSettings, photographyStyle } })
        })
      }
    })

    stores[photographyStyle] = create<StyleState>(createStore)
    
    // Initialize with defaults from the database
    getDefaultSettings(photographyStyle).then(defaultSettings => {
      stores[photographyStyle].setState({ settings: defaultSettings })
    }).catch(error => {
      console.error('Error initializing style store:', error)
      // Keep initial settings if there's an error
    })
  }

  return stores[photographyStyle]
} 