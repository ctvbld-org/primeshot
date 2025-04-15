import { create } from 'zustand'
import { StyleSettings, StylePhotographyStyle, StyleOutfit, StyleBackground, StyleOutfitColor } from '@/lib/types'
import { StateCreator } from 'zustand'

interface StyleState {
  settings: StyleSettings
  setBackground: (background: StyleBackground) => void
  setOutfit: (outfit: StyleOutfit) => void
  setPhotographyStyle: (style: StylePhotographyStyle) => void
  setOutfitColor: (color: StyleOutfitColor) => void
  reset: () => void
}

const defaultSettings: StyleSettings = {
  photographyStyle: 'studio',
  outfit: 'professional',
  background: 'plain',
  outfitColor: '#000000'
}

type StyleStore = StateCreator<StyleState>

export const useStyleStore = create<StyleState>((set: Parameters<StyleStore>[0]) => ({
  settings: defaultSettings,
  setBackground: (background) => set((state) => ({
    settings: { ...state.settings, background }
  })),
  setOutfit: (outfit) => set((state) => ({
    settings: { ...state.settings, outfit }
  })),
  setPhotographyStyle: (photographyStyle) => set((state) => ({
    settings: { ...state.settings, photographyStyle }
  })),
  setOutfitColor: (outfitColor) => set((state) => ({
    settings: { ...state.settings, outfitColor }
  })),
  reset: () => set({ settings: defaultSettings })
})) 