import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/api/client'

export interface SubscriptionTier {
  id: number
  name: string
  display_name: string
  description: string
  original_price: number
  monthly_price: number
  yearly_price: number
  credits: number
  max_resolution: string
  character_training_included: number
  concurrent_jobs: number
  max_characters: number
  features: string[]
  popular: boolean
  created_at: string
  updated_at: string
}

export interface CreditPack {
  id: number
  name: string
  credits: number
  price: number
  validity_days: number
  created_at: string
  updated_at: string
}

export interface CreditCosts {
  IMAGE_GENERATION_1K: number
  IMAGE_GENERATION_2K: number
  IMAGE_GENERATION_4K: number
  CHARACTER_TRAINING: number
}

export function useSubscriptionTiers() {
  return useQuery({
    queryKey: ['subscriptionTiers'],
    queryFn: async (): Promise<SubscriptionTier[]> => {
      const response = await fetch(getApiUrl('api/pricing/subscriptions'))
      if (!response.ok) {
        throw new Error('Failed to fetch subscription tiers')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  })
}

export function useCreditPacks() {
  return useQuery({
    queryKey: ['creditPacks'],
    queryFn: async (): Promise<CreditPack[]> => {
      const response = await fetch(getApiUrl('api/pricing/credit-packs'))
      if (!response.ok) {
        throw new Error('Failed to fetch credit packs')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  })
}

export function useCreditCosts() {
  return useQuery({
    queryKey: ['creditCosts'],
    queryFn: async (): Promise<CreditCosts> => {
      const response = await fetch(getApiUrl('api/pricing/credit-costs'))
      if (!response.ok) {
        throw new Error('Failed to fetch credit costs')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  })
}

// Helper functions for common operations
export function calculateImageCredits(resolution: '1K' | '2K' | '4K', batchSize: number = 1, creditCosts?: CreditCosts): number {
  if (!creditCosts) return 0
  const costKey = `IMAGE_GENERATION_${resolution}` as keyof CreditCosts
  return creditCosts[costKey] * batchSize
}

export function getCharacterTrainingCost(creditCosts?: CreditCosts): number {
  // Try CHARACTER_TRAINING first, fallback to FACE_MODEL_TRAINING for compatibility
  return creditCosts?.CHARACTER_TRAINING || (creditCosts as any)?.FACE_MODEL_TRAINING || 30 // fallback to default
}

export function getCharacterLimit(planName: string, subscriptionTiers?: SubscriptionTier[]): number {
  const tier = subscriptionTiers?.find(t => t.name === planName)
  // Use the correct column name that has been renamed in the database
  return tier?.max_characters || 1 // Default to 1 if tier not found
} 