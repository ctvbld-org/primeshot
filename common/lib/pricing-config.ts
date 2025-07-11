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
 * - CREDIT_COST_FACE_MODEL_TRAINING (default: 30)
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
  faceModelTrainingIncluded: number;
  concurrentJobs: number;
  maxFaceModels: number;
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
  FACE_MODEL_TRAINING: number;
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

// DEPRECATED: All pricing config is now DB-driven. This file is a compatibility layer.
// Remove all static config and replace with async DB-backed fetchers.

export async function fetchSubscriptionTiers(supabaseClient: any) {
  const { data, error } = await supabaseClient.from('subscriptions').select('*');
  if (error) throw error;
  return data;
}

export async function fetchCreditPacks(supabaseClient: any) {
  const { data, error } = await supabaseClient.from('credit_packs').select('*');
  if (error) throw error;
  return data;
}

export async function fetchCreditCosts(supabaseClient: any) {
  const { data, error } = await supabaseClient.from('credit_costs').select('*');
  if (error) throw error;
  return data;
}

// All static config below is deprecated and should be removed after migration is complete.

export const SUBSCRIPTION_TIERS_CONFIG: SubscriptionTierConfig[] = [
  {
    id: 'basic',
    name: 'Basic',
    displayName: 'Basic',
    description: 'Includes 40 credits per month, plus 1 Face Model training (30 credits value).',
    originalPrice: 14,
    monthlyPrice: 9, // Discounted price
    yearlyPrice: 9, // Discounted yearly price (per month)
    credits: 40,
    maxResolution: '1K' as const,
    faceModelTrainingIncluded: 1,
    concurrentJobs: 1,
    maxFaceModels: 1,
    features: [
      '40 monthly credits',
      'Standard image resolution (1K max)',
      'Includes 1 Face Model training',
      '1 concurrent job',
      '1 Face Model slot',
      'Up to 40 images per month'
    ],
    popular: false
  },
  {
    id: 'standard',
    name: 'Standard',
    displayName: 'Standard',
    description: 'Includes 180 credits per month, plus 1 Face Model training (30 credits value).',
    originalPrice: 39,
    monthlyPrice: 29, // Discounted price
    yearlyPrice: 18, // Discounted yearly price (per month)
    credits: 180,
    maxResolution: '4K' as const,
    faceModelTrainingIncluded: 1,
    concurrentJobs: 2,
    maxFaceModels: 3,
    features: [
      '180 monthly credits',
      'Ultra high image resolution (up to 4K)',
      'Includes 1 Face Model training',
      '2 concurrent jobs',
      '3 Face Model slots',
      'Up to 180×1K, 90×2K, or 60×4K images per month'
    ],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    displayName: 'Pro',
    description: 'Includes 450 credits per month, plus 3 Face Model trainings (90 credits value).',
    originalPrice: 89,
    monthlyPrice: 69, // Discounted price
    yearlyPrice: 39, // Discounted yearly price (per month)
    credits: 450,
    maxResolution: '4K' as const,
    faceModelTrainingIncluded: 3,
    concurrentJobs: 4,
    maxFaceModels: 8,
    features: [
      '450 monthly credits',
      'Ultra high image resolution (up to 4K)',
      'Includes 3 Face Model trainings',
      '4 concurrent jobs',
      '8 Face Model slots',
      'Up to 450×1K, 225×2K, or 150×4K images per month'
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
  FACE_MODEL_TRAINING: parseInt(getEnvVar('CREDIT_COST_FACE_MODEL_TRAINING', '30'))
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

export function getFaceModelTrainingCost(): number {
  return CREDIT_COSTS_CONFIG.FACE_MODEL_TRAINING;
}

export function getFaceModelLimit(planName: string): number {
  const tier = SUBSCRIPTION_TIERS_CONFIG.find(t => t.id === planName);
  return tier?.maxFaceModels || 1; // Default to 1 if tier not found
} 