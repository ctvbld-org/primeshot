// Style-related types
export type StylePhotographyStyle = string
export type StyleBackground = string
export type StyleClothing = string
export type StyleClothingColor = string
export type Gender = 'male' | 'female'
export type StyleStatus = 'draft' | 'pending' | 'processing' | 'completed'

export interface StyleSettings {
  photographyStyle: StylePhotographyStyle
  background: StyleBackground
  clothing: StyleClothing
  clothingColor?: StyleClothingColor
  gender?: Gender
  customSettings?: Record<string, unknown>
}

// Database entity types
export type User = {
  id: string
  email: string
  full_name: string | null
  gender?: Gender
  created_at: string
  updated_at: string
}

export type Session = {
  id: string
  user_id: string
  created_at: string
  expires_at: string
}

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
  created_at: string
  updated_at: string
  metadata: Record<string, any>
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
  customData?: Record<string, unknown>
}

export type ImageDimensions = {
  width: number
  height: number
}

export interface Image {
  id: string;
  style_id: string;
  user_id: string;
  url: string;
  file_name: string;
  file_size: number;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  dimensions: ImageDimensions;
  created_at: string;
  updated_at: string;
  character_id?: string;
  quality_score?: number;
}

export interface FileWithScore extends Partial<File> {
  name: string;
  score?: number;
  url?: string;
  isExisting?: boolean;
  order_id?: string;
  id?: string;
  // Normalized face box for primary face (0..1)
  faceBox?: { x: number; y: number; width: number; height: number };
  // Marks this file as the first accepted image in the batch for thumbnail creation
  isFirstImage?: boolean;
}

export type HeadshotInfo = {
  styleCount: number
  totalHeadshots: number
  headshotsPerStyle: number
  tier: string
  price: number
}

// Database insert types (omit generated fields)
export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type InsertStyle = Omit<Style, 'id' | 'created_at' | 'updated_at'>
export type InsertImage = Omit<Image, 'id' | 'created_at'>

// Database update types (all fields optional except id)
export type UpdateUser = Partial<Omit<User, 'id'>> & { id: string }
export type UpdateStyle = Partial<Omit<Style, 'id'>> & { id: string }
export type UpdateImage = Partial<Omit<Image, 'id'>> & { id: string } 