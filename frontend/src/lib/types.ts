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

export type CompositionOutfit = 'professional' | 'casual' | 'creative'
export type CompositionBackground = 
  | 'plain'
  | 'office'
  | 'outdoor'
  | 'bookshelf'
  | 'cafe'
  | 'studio'
  | 'gradient'
  | 'cityscape'
  | 'abstract'
  | 'brick'
  | 'nature'
  | 'tech'
  | 'custom'
export type CompositionPhotographyStyle = 'studio' | 'natural' | 'dramatic'
export type CompositionStatus = 'draft' | 'pending' | 'processing' | 'completed'

export type OrderStatus = 
  | 'draft'           // Initial state when creating compositions
  | 'pending_payment' // Ready for payment
  | 'paid'           // Payment successful
  | 'processing'     // Generating images
  | 'completed'      // All images generated
  | 'cancelled'      // Order cancelled

export type Order = {
  id: string
  user_id: string
  status: OrderStatus
  amount: number
  currency: string
  payment_intent_id?: string
  payment_status?: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type CompositionSettings = {
  photographyStyle: CompositionPhotographyStyle
  outfit: CompositionOutfit
  background: CompositionBackground
  customSettings?: Record<string, any>
}

export type Composition = {
  id: string
  user_id: string
  order_id: string  // Reference to the order
  name: string
  settings: CompositionSettings
  status: CompositionStatus
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