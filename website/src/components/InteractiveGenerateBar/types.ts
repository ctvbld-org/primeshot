export type PanelKey = 'styles' | 'scenes' | 'wardrobe' | 'characters' | 'settings' | 'cta' | null

export interface ScrollSectionConfig {
  id: string
  panel: PanelKey
  // Trigger zones (in viewport percentage, e.g., 0.5 = middle of screen)
  triggerStart?: number
  triggerEnd?: number
}

