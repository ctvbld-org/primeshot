export type User = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Session = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export type CompositionStyle = 'professional' | 'casual' | 'creative'
export type CompositionBackground = 'plain' | 'office' | 'outdoor' | 'custom'
export type CompositionLighting = 'studio' | 'natural' | 'dramatic'
export type CompositionPose = 'front' | 'threequarter' | 'side'

export type CompositionSettings = {
  style: CompositionStyle
  background: CompositionBackground
  lighting: CompositionLighting
  pose: CompositionPose
  customSettings?: Record<string, any>
}

export type Composition = {
  id: string
  user_id: string
  name: string
  settings: CompositionSettings
  created_at: string
  updated_at: string
}

export type ImageDimensions = {
  width: number
  height: number
}

export type Image = {
  id: string
  composition_id: string
  user_id: string
  url: string
  file_name: string
  file_size: number
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp'
  dimensions: ImageDimensions
  created_at: string
}

// Database insert types (omit generated fields)
export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type InsertComposition = Omit<Composition, 'id' | 'created_at' | 'updated_at'>
export type InsertImage = Omit<Image, 'id' | 'created_at'>

// Database update types (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id'>> & { id: string }
export type UpdateComposition = Partial<Omit<Composition, 'id'>> & { id: string }
export type UpdateImage = Partial<Omit<Image, 'id'>> & { id: string } 