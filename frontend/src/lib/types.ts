export type User = {
  id: string
  email: string
  full_name: string | null
  gender?: Gender
  created_at: string
  updated_at: string
}

export type Gender = 'male' | 'female'

export type Session = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

export type StyleOutfit = 
  | 'professional' 
  | 'casual' 
  | 'creative'
  | 'business-casual'
  | 'startup'
  | 'formal'
  | 'tech'
export type StyleBackground = 
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
// IMPORTANT: This should match the IDs in lib/config/styles.json which is the source of truth
export type StylePhotographyStyle = 
  | 'studio' 
  | 'studio-2'
  | 'business-portrait'
  | 'business-portrait-2'
  | 'outdoor-fashion'
  | 'outdoor-fashion-2'
export type StyleStatus = 'draft' | 'pending' | 'processing' | 'completed'

// TODO: Define specific color options, e.g., using Tailwind color names or hex codes
export type StyleOutfitColor = string // Example: 'blue-500', '#ffffff', 'black'

export type OrderStatus = 
  | 'draft'           // Initial state when creating styles
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
  shoot_number?: number
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type StyleSettings = {
  photographyStyle: StylePhotographyStyle
  outfit: StyleOutfit
  background: StyleBackground
  outfitColor?: StyleOutfitColor
  gender?: Gender
  customSettings?: Record<string, any>
}

export type Style = {
  id: string
  user_id: string
  order_id: string  // Reference to the order
  name: string
  settings: StyleSettings
  status: StyleStatus
  created_at: string
  updated_at: string
}

export type ImageDimensions = {
  width: number
  height: number
}

export type Image = {
  id: string
  style_id: string
  user_id: string
  url: string
  file_name: string
  file_size: number
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp'
  dimensions: ImageDimensions
  created_at: string
}

// Add HeadshotInfo interface for caching and type safety
export interface HeadshotInfo {
  styleCount: number;
  totalHeadshots: number;
  headshotsPerStyle: number;
  tier: string;
  price: number;
}

// Database insert types (omit generated fields)
export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type InsertStyle = Omit<Style, 'id' | 'created_at' | 'updated_at'>
export type InsertImage = Omit<Image, 'id' | 'created_at'>

// Database update types (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id'>> & { id: string }
export type UpdateStyle = Partial<Omit<Style, 'id'>> & { id: string }
export type UpdateImage = Partial<Omit<Image, 'id'>> & { id: string } 