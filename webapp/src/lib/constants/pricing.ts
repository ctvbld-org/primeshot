/**
 * SHARED PRICING CONSTANTS
 * 
 * This file serves as the single source of truth for pricing information
 * across both frontend and Supabase Edge Functions.
 * 
 * IMPORTANT: When updating pricing, edit scripts/pricing-config.js and
 * remember to deploy both frontend and Edge Functions to maintain consistency.
 */

import { 
  SUBSCRIPTION_TIERS_CONFIG, 
  CREDIT_PACKS_CONFIG, 
  CREDIT_COSTS_CONFIG 
} from '../../../../scripts/pricing-config.js'

// Credit-based subscription pricing configuration
// This maps to Stripe products and metadata defined in Stripe Dashboard

export interface SubscriptionTier {
  id: string
  name: string
  displayName: string
  description: string
  monthlyPrice: number // in dollars
  yearlyPrice?: number // in dollars
  credits: number
  maxResolution: '1K' | '2K' | '4K'
  loraTrainingIncluded: number
  concurrentJobs: number
  maxLoras: number
  features: string[]
  popular?: boolean
  stripePriceIds: {
    monthly: string
    yearly?: string
  }
}

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number // in dollars
  validityDays: number
  costPerCredit: number
  savings?: string
  stripePriceId: string
}

// Subscription Tiers - Enhanced with real Stripe price IDs
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = SUBSCRIPTION_TIERS_CONFIG.map(tier => {
  const stripePriceIds: { monthly: string; yearly?: string } = {
    monthly: '',
    yearly: tier.yearlyPrice ? '' : undefined
  }

  // Add real Stripe price IDs based on tier ID
  switch (tier.id) {
    case 'tier_1':
      stripePriceIds.monthly = 'price_1Rh4C0ENpyFv1vJe4Cu4PBF6'
      stripePriceIds.yearly = 'price_1Rh4C1ENpyFv1vJema77VrLN'
      break
    case 'tier_2':
      stripePriceIds.monthly = 'price_1Rh4C1ENpyFv1vJeyiW6hmCB'
      stripePriceIds.yearly = 'price_1Rh4C2ENpyFv1vJeyYZzgfaJ'
      break
    case 'tier_3':
      stripePriceIds.monthly = 'price_1Rh4C2ENpyFv1vJeYzFFstf9'
      stripePriceIds.yearly = 'price_1Rh4C3ENpyFv1vJeYx5nVsUK'
      break
  }

  return {
    ...tier,
    maxResolution: tier.maxResolution as '1K' | '2K' | '4K',
    stripePriceIds
  }
})

// Credit Packs - Enhanced with real Stripe price IDs
export const CREDIT_PACKS: CreditPack[] = CREDIT_PACKS_CONFIG.map(pack => {
  let stripePriceId = ''

  // Add real Stripe price IDs based on pack ID
  switch (pack.id) {
    case 'credits_90':
      stripePriceId = 'price_1Rh4C3ENpyFv1vJesxkBqqgL'
      break
    case 'credits_180':
      stripePriceId = 'price_1Rh4C4ENpyFv1vJeFHcPL4S0'
      break
    case 'credits_360':
      stripePriceId = 'price_1Rh4C5ENpyFv1vJeuelpXnVe'
      break
  }

  return {
    ...pack,
    stripePriceId
  }
})

// Credit costs for different operations - imported from shared config
export const CREDIT_COSTS = CREDIT_COSTS_CONFIG

// Batch size pricing (no discounts)
export const BATCH_PRICING = {
  '1K': [
    { size: 5, credits: 5 },
    { size: 10, credits: 10 },
    { size: 20, credits: 20 }
  ],
  '2K': [
    { size: 5, credits: 10 },
    { size: 10, credits: 20 },
    { size: 20, credits: 40 }
  ],
  '4K': [
    { size: 5, credits: 15 },
    { size: 10, credits: 30 },
    { size: 20, credits: 60 }
  ]
} as const

// Helper functions
export function getTierById(tierId: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === tierId)
}

export function getPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.id === packId)
}

export function calculateImageCredits(resolution: '1K' | '2K' | '4K', batchSize: number): number {
  return CREDIT_COSTS.IMAGE_GENERATION[resolution] * batchSize
}

export function canGenerateAtResolution(userTier: string, requestedResolution: '1K' | '2K' | '4K'): boolean {
  const tier = getTierById(userTier)
  if (!tier) return false

  const resolutionHierarchy = { '1K': 1, '2K': 2, '4K': 3 }
  const userMaxLevel = resolutionHierarchy[tier.maxResolution]
  const requestedLevel = resolutionHierarchy[requestedResolution]

  return requestedLevel <= userMaxLevel
}

// Discount information
export const LAUNCH_DISCOUNT = {
  tier_1: { originalPrice: 14, discountedPrice: 9, savings: 5 },
  tier_2: { originalPrice: 39, discountedPrice: 29, savings: 10 },
  tier_3: { originalPrice: 89, discountedPrice: 69, savings: 20 }
}

export const YEARLY_DISCOUNT = {
  tier_1: { monthlyPrice: 9, yearlyPrice: 9, savings: '36%' },
  tier_2: { monthlyPrice: 29, yearlyPrice: 18, savings: '55%' },
  tier_3: { monthlyPrice: 69, yearlyPrice: 39, savings: '55%' }
}

// Plan comparison features
export const PLAN_FEATURES = {
  INCLUDED: ['✓', 'included', 'yes', true],
  NOT_INCLUDED: ['✗', 'not included', 'no', false],
  LIMITED: ['limited', 'basic']
}

// Export types for usage in components
export type ResolutionType = '1K' | '2K' | '4K'
export type PlanTierType = 'tier_1' | 'tier_2' | 'tier_3'

/**
 * Version string to help with tracking pricing changes
 * Increment this when modifying pricing structure
 */
export const PRICING_VERSION = '1.0.1';

/**
 * Use this comment block when copying to Edge Functions:
 * 
 * ```ts
 * // PRICING_VERSION: 1.0.1
 * // This is a copy of the frontend/src/lib/constants/pricing.ts file
 * // Last synchronized: ${new Date().toISOString()}
 * ```
 */ 