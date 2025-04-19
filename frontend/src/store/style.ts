import { create } from 'zustand'
import { StyleSettings, StylePhotographyStyle, StyleOutfit, StyleBackground, StyleOutfitColor, Gender } from '@/lib/types'
import { StateCreator } from 'zustand'
import stylesConfig from '@/lib/config/styles.json' assert { type: "json" };

interface StyleState {
  settings: StyleSettings
  setBackground: (background: StyleBackground) => void
  setOutfit: (outfit: StyleOutfit) => void
  setPhotographyStyle: (style: StylePhotographyStyle) => void
  setOutfitColor: (color: StyleOutfitColor) => void
  setGender: (gender: Gender) => void
  reset: () => void
}

// Get the first style from config to use as default
const firstStyle = stylesConfig[0];

// Create safe default settings based on the first available style in config
const defaultSettings: StyleSettings = {
  photographyStyle: firstStyle.id as StylePhotographyStyle,
  outfit: firstStyle.availableOutfits[0] as StyleOutfit,
  background: firstStyle.availableBackgrounds[0] as StyleBackground,
  outfitColor: firstStyle.availableOutfitColors[0] as StyleOutfitColor,
  gender: 'male' // Default gender
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
  setGender: (gender) => set((state) => ({
    settings: { ...state.settings, gender }
  })),
  reset: () => set({ settings: defaultSettings })
})) 