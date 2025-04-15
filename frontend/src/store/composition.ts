import { create } from 'zustand'
import { CompositionSettings, CompositionPhotographyStyle, CompositionOutfit, CompositionBackground, CompositionOutfitColor } from '@/lib/types'
import { StateCreator } from 'zustand'

interface CompositionState {
  settings: CompositionSettings
  setBackground: (background: CompositionBackground) => void
  setOutfit: (outfit: CompositionOutfit) => void
  setPhotographyStyle: (style: CompositionPhotographyStyle) => void
  setOutfitColor: (color: CompositionOutfitColor) => void
  reset: () => void
}

const defaultSettings: CompositionSettings = {
  photographyStyle: 'studio',
  outfit: 'professional',
  background: 'plain',
  outfitColor: '#000000'
}

type CompositionStore = StateCreator<CompositionState>

export const useCompositionStore = create<CompositionState>((set: Parameters<CompositionStore>[0]) => ({
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