/**
 * FRONTEND PRICING CONSTANTS
 * 
 * This file imports from the single source of truth: @primeshot/common/lib/pricing-config
 * NO DUPLICATION - all configuration comes from that file!
 * 
 * Stripe price IDs are environment-aware (test vs production)
 * Environment detection: VERCEL_TARGET_ENV or NODE_ENV
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

// Subscription tiers with environment-aware Stripe price IDs
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

// Credit Packs - Enhanced with environment-aware Stripe price IDs
export const CREDIT_PACKS: CreditPack[] = CREDIT_PACKS_CONFIG.map(pack => {
  // Get environment-specific price ID
  const priceConfig = getCreditPackPriceId(pack.id)
  const stripePriceId = priceConfig?.price || ''

  return {
    ...pack,
    stripePriceId
  }
})

// Import credit costs from single source - NO DUPLICATION!
export const CREDIT_COSTS = CREDIT_COSTS_CONFIG

// Batch size pricing calculated from single source
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
  tier_1: getLaunchDiscount('tier_1'),
  tier_2: getLaunchDiscount('tier_2'),
  tier_3: getLaunchDiscount('tier_3')
}

export const YEARLY_DISCOUNT = {
  tier_1: getYearlyDiscount('tier_1'),
  tier_2: getYearlyDiscount('tier_2'),
  tier_3: getYearlyDiscount('tier_3')
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
export const PRICING_VERSION = '1.1.0';

/**
 * Current Stripe environment being used
 * Useful for debugging and confirming correct environment
 */
export const STRIPE_ENVIRONMENT = getEnvironment();

/**
 * Use this comment block when copying to Edge Functions:
 * 
 * ```ts
 * // PRICING_VERSION: 1.0.1
 * // This is a copy of the frontend/src/lib/constants/pricing.ts file
 * // Last synchronized: ${new Date().toISOString()}
 * ```
 */ 