import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@primeshot/common'

export interface SubscriptionTier {
  id: number
  name: string
  display_name: string
  description: string
  original_price: number
  monthly_price: number
  yearly_price: number
  credits: number
  max_quality: string
  character_training_included: number
  concurrent_jobs: number
  max_characters: number
  features: string[]
  popular: boolean
  disabled?: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

export interface CreditPack {
  id: number
  name: string
  credits: number
  price: number
  validity_days: number
  image_url?: string
  created_at: string
  updated_at: string
}

export type CreditCosts = Record<string, number>

export interface PricingData {
  subscriptions: SubscriptionTier[]
  creditPacks: CreditPack[]
  creditCosts: CreditCosts
}

// New batched hook for all pricing data
export function usePricingData() {
  return useQuery({
    queryKey: ['pricingData'],
    queryFn: async (): Promise<PricingData> => {
      const response = await fetch(getApiUrl('api/pricing/all'))
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  })
}

// Individual hooks that use the batched data
export function useSubscriptionTiers() {
  const { data, ...rest } = usePricingData()
  return {
    data: data?.subscriptions,
    ...rest
  }
}

export function useCreditPacks() {
  const { data, ...rest } = usePricingData()
  return {
    data: data?.creditPacks,
    ...rest
  }
}

export function useCreditCosts() {
  const { data, ...rest } = usePricingData()
  return {
    data: data?.creditCosts,
    ...rest
  }
}

// Helper functions for common operations
export function calculateImageCredits(quality: string, batchSize: number = 1, creditCosts?: CreditCosts): number {
  if (!creditCosts) return 0
  const costKey = `IMAGE_GENERATION_${quality}`
  const perImage = creditCosts[costKey] ?? 1
  return perImage * batchSize
}

export function getCharacterTrainingCost(creditCosts?: CreditCosts): number {
  return creditCosts?.['CHARACTER_TRAINING'] ?? 30
}

export function getCharacterLimit(planName: string, subscriptionTiers?: SubscriptionTier[]): number {
  const tier = subscriptionTiers?.find(t => t.name === planName)
  // Use the correct column name that has been renamed in the database
  return tier?.max_characters || 1 // Default to 1 if tier not found
} 