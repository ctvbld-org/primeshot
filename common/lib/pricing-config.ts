/**
 * SINGLE SOURCE OF TRUTH FOR ALL PRICING CONFIGURATION
 * 
 * This file contains ALL pricing configuration and supports environment variable overrides.
 * All other files should import from this file - NO DUPLICATION!
 * 
 * Environment Variables (with fallbacks to defaults):
 * - CREDIT_COST_1K (default: 1)
 * - CREDIT_COST_2K (default: 2) 
 * - CREDIT_COST_4K (default: 3)
 * - CREDIT_COST_LORA_TRAINING (default: 30)
 */

export type Resolution = '1K' | '2K' | '4K';

export interface SubscriptionTierConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  originalPrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  maxResolution: Resolution;
  loraTrainingIncluded: number;
  concurrentJobs: number;
  maxLoras: number;
  features: string[];
  popular: boolean;
}

export interface CreditPackConfig {
  id: string;
  name: string;
  credits: number;
  price: number;
  validityDays: number;
  costPerCredit: number;
  savings?: string;
}

export interface CreditCosts {
  IMAGE_GENERATION: {
    [K in Resolution]: number;
  };
  LORA_TRAINING: number;
}

// Function to get environment variable from multiple possible sources
function getEnvVar(name: string, fallback: string): string {
  // Check for Deno environment
  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    return (globalThis as any).Deno.env.get(name) || fallback;
  }
  
  // Check for Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || fallback;
  }
  
  return fallback;
}

export const SUBSCRIPTION_TIERS_CONFIG: SubscriptionTierConfig[] = [
  {
    id: 'tier_1',
    name: 'Starter',
    displayName: 'Starter',
    description: 'Perfect for individuals getting started with AI image generation',
    originalPrice: 14,
    monthlyPrice: 9, // Discounted price
    yearlyPrice: 9, // Discounted yearly price (per month)
    credits: 40,
    maxResolution: '1K',
    loraTrainingIncluded: 1,
    concurrentJobs: 1,
    maxLoras: 1,
    features: [
      '40 credits per month',
      '1K resolution max',
      '1 Face Model training included',
      '1 concurrent job',
      '1 max Face Model',
      'Up to 40×1K images'
    ],
    popular: false
  },
  {
    id: 'tier_2',
    name: 'Premium',
    displayName: 'Premium',
    description: 'Ideal for content creators and small businesses',
    originalPrice: 39,
    monthlyPrice: 29, // Discounted price
    yearlyPrice: 18, // Discounted yearly price (per month)
    credits: 180,
    maxResolution: '4K',
    loraTrainingIncluded: 1,
    concurrentJobs: 2,
    maxLoras: 3,
    features: [
      '180 credits per month',
      'Up to 4K resolution',
      '1 Face Model training included',
      '2 concurrent jobs',
      '3 max Face Models',
      'Up to 180×1K or 90×2K or 60×4K images'
    ],
    popular: true
  },
  {
    id: 'tier_3',
    name: 'Pro',
    displayName: 'Pro',
    description: 'For agencies and high-volume users',
    originalPrice: 89,
    monthlyPrice: 69, // Discounted price
    yearlyPrice: 39, // Discounted yearly price (per month)
    credits: 450,
    maxResolution: '4K',
    loraTrainingIncluded: 3,
    concurrentJobs: 4,
    maxLoras: 8,
    features: [
      '450 credits per month',
      'Up to 4K resolution',
      '3 Face Model training included',
      '4 concurrent jobs',
      '8 max Face Models',
      'Up to 450×1K or 225×2K or 150×4K images'
    ],
    popular: false
  }
];

export const CREDIT_PACKS_CONFIG: CreditPackConfig[] = [
  {
    id: 'credits_90',
    name: '90 Credits',
    credits: 90,
    price: 19,
    validityDays: 60,
    costPerCredit: 0.211
  },
  {
    id: 'credits_180',
    name: '180 Credits',
    credits: 180,
    price: 32,
    validityDays: 60,
    costPerCredit: 0.177,
    savings: 'Save 16%'
  },
  {
    id: 'credits_360',
    name: '360 Credits',
    credits: 360,
    price: 58,
    validityDays: 60,
    costPerCredit: 0.16,
    savings: 'Save 24%'
  }
];

// Credit costs - configurable via environment variables
export const CREDIT_COSTS_CONFIG: CreditCosts = {
  IMAGE_GENERATION: {
    '1K': parseInt(getEnvVar('CREDIT_COST_1K', '1')),
    '2K': parseInt(getEnvVar('CREDIT_COST_2K', '2')),
    '4K': parseInt(getEnvVar('CREDIT_COST_4K', '3'))
  },
  LORA_TRAINING: parseInt(getEnvVar('CREDIT_COST_LORA_TRAINING', '30'))
};

// Helper functions to calculate savings (derived from SUBSCRIPTION_TIERS_CONFIG)
export function getLaunchDiscount(tierId: string) {
  const tier = SUBSCRIPTION_TIERS_CONFIG.find(t => t.id === tierId);
  if (!tier) return null;
  return {
    originalPrice: tier.originalPrice,
    discountedPrice: tier.monthlyPrice,
    savings: tier.originalPrice - tier.monthlyPrice
  };
}

export function getYearlyDiscount(tierId: string) {
  const tier = SUBSCRIPTION_TIERS_CONFIG.find(t => t.id === tierId);
  if (!tier) return null;
  const monthlySavings = tier.monthlyPrice - tier.yearlyPrice;
  const yearlySavingsPercent = Math.round((monthlySavings / tier.monthlyPrice) * 100);
  return {
    originalPrice: tier.originalPrice,
    yearlyPrice: tier.yearlyPrice,
    savings: `${yearlySavingsPercent}%`
  };
}

// Helper functions
export function calculateImageCredits(resolution: Resolution, batchSize: number = 1): number {
  return CREDIT_COSTS_CONFIG.IMAGE_GENERATION[resolution] * batchSize;
}

export function getLoraTrainingCost(): number {
  return CREDIT_COSTS_CONFIG.LORA_TRAINING;
} 