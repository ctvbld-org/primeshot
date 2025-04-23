import { create } from 'zustand'
import { StateCreator } from 'zustand'
import type { StyleSettings, StylePhotographyStyle, StyleBackground, StyleClothing, StyleClothingColor, Gender } from '@/lib/types'
import { validateStyleSettings } from '@/lib/utils/style-validation'

interface StyleState {
  settings: StyleSettings
  setBackground: (background: StyleBackground) => Promise<void>
  setClothing: (clothing: StyleClothing) => Promise<void>
  setPhotographyStyle: (style: StylePhotographyStyle) => Promise<void>
  setClothingColor: (color: StyleClothingColor) => Promise<void>
  setGender: (gender: Gender) => void
  reset: () => void
}

// Default settings will be updated when data is loaded
const defaultSettings: StyleSettings = {
  photographyStyle: 'studio',
  background: 'plain-light',
  clothing: 'shirt',
  gender: 'male',
  clothingColor: '#FFFFFF',
}

type StyleStore = StateCreator<StyleState>

export const useStyleStore = create<StyleState>((set: Parameters<StyleStore>[0]) => ({
  settings: defaultSettings,
  setBackground: async (background) => {
    const newSettings = { ...defaultSettings, background }
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
    const newSettings = { ...defaultSettings, clothing }
    const { isValid, errors } = await validateStyleSettings(newSettings)
    if (!isValid) {
      console.error('Invalid style settings:', errors)
      throw new Error(errors.join(', '))
    }
    set((state) => ({
      settings: { ...state.settings, clothing }
    }))
  },
  setPhotographyStyle: async (photographyStyle) => {
    const newSettings = { ...defaultSettings, photographyStyle }
    const { isValid, errors } = await validateStyleSettings(newSettings)
    if (!isValid) {
      console.error('Invalid style settings:', errors)
      throw new Error(errors.join(', '))
    }
    set((state) => ({
      settings: { ...state.settings, photographyStyle }
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
  reset: () => set({ settings: defaultSettings })
})) 