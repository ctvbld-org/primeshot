import { create } from 'zustand'
import { CompositionSettings, CompositionPhotographyStyle } from '@/lib/types'
import { StateCreator } from 'zustand'

interface CompositionState {
  settings: CompositionSettings
  setBackground: (background: CompositionSettings['background']) => void
  setOutfit: (outfit: CompositionSettings['outfit']) => void
  setPhotographyStyle: (style: CompositionPhotographyStyle) => void
  reset: () => void
}

const defaultSettings: CompositionSettings = {
  photographyStyle: 'studio',
  outfit: 'professional',
  background: 'plain'
}

type CompositionStore = StateCreator<CompositionState>

export const useCompositionStore = create<CompositionState>((set: Parameters<CompositionStore>[0]) => ({
  settings: defaultSettings,
  setBackground: (background: CompositionSettings['background']) => set((state) => ({
    settings: { ...state.settings, background }
  })),
  setOutfit: (outfit: CompositionSettings['outfit']) => set((state) => ({
    settings: { ...state.settings, outfit }
  })),
  setPhotographyStyle: (photographyStyle: CompositionPhotographyStyle) => set((state) => ({
    settings: { ...state.settings, photographyStyle }
  })),
  reset: () => set({ settings: defaultSettings })
})) 