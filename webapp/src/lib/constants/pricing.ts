/**
 * DEPRECATED: FRONTEND PRICING CONSTANTS
 * 
 * ⚠️ THIS FILE IS DEPRECATED! ⚠️
 * 
 * Use the new DB-backed pricing hooks instead:
 * - useSubscriptionTiers() from '@/hooks/usePricingConfig'
 * - useCreditPacks() from '@/hooks/usePricingConfig'
 * - useCreditCosts() from '@/hooks/usePricingConfig'
 * 
 * This file is kept for backward compatibility during migration.
 * All new components should use the DB-backed hooks.
 */

import { 
  SUBSCRIPTION_TIERS_CONFIG, 
  CREDIT_PACKS_CONFIG,
  CREDIT_COSTS_CONFIG,
  getLaunchDiscount,
  getYearlyDiscount,
  calculateImageCredits as calculateImageCreditsBase
} from '@primeshot/common/lib/pricing-config'
import { STRIPE_REFERENCE } from './stripe-reference'

// Environment detection
function getEnvironment(): 'test' | 'production' {
  // Check Vercel environment first
  if (typeof process !== 'undefined' && process.env.VERCEL_TARGET_ENV) {
    return process.env.VERCEL_TARGET_ENV === 'production' ? 'production' : 'test'
  }
  
  // Fallback to NODE_ENV
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'production'
  }
  
  // Default to test for safety
  return 'test'
}

// Get current environment config
const STRIPE_ENV_CONFIG = STRIPE_REFERENCE[getEnvironment()]

// Helper functions
function getSubscriptionPriceIds(tierId: string) {
  return STRIPE_ENV_CONFIG.subscriptions[tierId as keyof typeof STRIPE_ENV_CONFIG.subscriptions]
}

function getCreditPackPriceId(packId: string) {
  return STRIPE_ENV_CONFIG.creditPacks[packId as keyof typeof STRIPE_ENV_CONFIG.creditPacks]
}

// Re-export types for TypeScript
export interface SubscriptionTier {
  id: string
  name: string
  displayName: string
  description: string
  originalPrice: number // in dollars (non-discounted price)
  monthlyPrice: number // in dollars (discounted price)
  yearlyPrice: number // in dollars (discounted yearly price per month)
  credits: number
  maxResolution: '1K' | '2K' | '4K'
  faceModelTrainingIncluded: number
  concurrentJobs: number
  maxFaceModels: number
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

// DEPRECATED: Use useSubscriptionTiers() hook instead
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = SUBSCRIPTION_TIERS_CONFIG.map(tier => {
  // Get environment-specific price IDs
  const priceConfig = getSubscriptionPriceIds(tier.id)
  const stripePriceIds = {
    monthly: priceConfig?.monthly || '',
    yearly: priceConfig?.yearly || ''
  }

  return {
    ...tier,
    maxResolution: tier.maxResolution as '1K' | '2K' | '4K',
    stripePriceIds
  }
})

// DEPRECATED: Use useCreditPacks() hook instead
export const CREDIT_PACKS: CreditPack[] = CREDIT_PACKS_CONFIG.map(pack => {
  // Get environment-specific price ID
  const priceConfig = getCreditPackPriceId(pack.id)
  const stripePriceId = priceConfig?.price || ''

  return {
    ...pack,
    stripePriceId
  }
})

// DEPRECATED: Use useCreditCosts() hook instead
export const CREDIT_COSTS = CREDIT_COSTS_CONFIG

// DEPRECATED: Use calculateImageCredits() helper from usePricingConfig instead
export const BATCH_PRICING = {
  '1K': [
    { size: 5, credits: 5 * CREDIT_COSTS.IMAGE_GENERATION['1K'] },
    { size: 10, credits: 10 * CREDIT_COSTS.IMAGE_GENERATION['1K'] },
    { size: 20, credits: 20 * CREDIT_COSTS.IMAGE_GENERATION['1K'] }
  ],
  '2K': [
    { size: 5, credits: 5 * CREDIT_COSTS.IMAGE_GENERATION['2K'] },
    { size: 10, credits: 10 * CREDIT_COSTS.IMAGE_GENERATION['2K'] },
    { size: 20, credits: 20 * CREDIT_COSTS.IMAGE_GENERATION['2K'] }
  ],
  '4K': [
    { size: 5, credits: 5 * CREDIT_COSTS.IMAGE_GENERATION['4K'] },
    { size: 10, credits: 10 * CREDIT_COSTS.IMAGE_GENERATION['4K'] },
    { size: 20, credits: 20 * CREDIT_COSTS.IMAGE_GENERATION['4K'] }
  ]
} as const

// Helper functions - imported from single source
export function getTierById(tierId: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === tierId)
}

export function getPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.id === packId)
}

// Use the function from single source
export const calculateImageCredits = calculateImageCreditsBase

// Discount information - calculated from single source
export const LAUNCH_DISCOUNT = {
  basic: getLaunchDiscount('basic'),
  standard: getLaunchDiscount('standard'),
  pro: getLaunchDiscount('pro')
}

export const YEARLY_DISCOUNT = {
  basic: getYearlyDiscount('basic'),
  standard: getYearlyDiscount('standard'),
  pro: getYearlyDiscount('pro')
}


// Plan comparison features
export const PLAN_FEATURES = {
  INCLUDED: ['✓', 'included', 'yes', true],
  NOT_INCLUDED: ['✗', 'not included', 'no', false],
  LIMITED: ['limited', 'basic']
}

// Export types for usage in components
export type ResolutionType = '1K' | '2K' | '4K'
export type PlanTierType = 'basic' | 'standard' | 'pro'

/**
 * Version string to help with tracking pricing changes
 * Increment this when modifying pricing structure
 */
export const PRICING_VERSION = '2.0.0-deprecated';

/**
 * Current Stripe environment being used
 * Useful for debugging and confirming correct environment
 */
export const STRIPE_ENVIRONMENT = getEnvironment(); 