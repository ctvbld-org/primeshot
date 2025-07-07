/**
 * SUPABASE EDGE FUNCTIONS PRICING CONSTANTS
 * 
 * This file reads from environment variables for configurable pricing.
 * Environment variables allow changing pricing without code deployment!
 * 
 * Environment Variables (configurable in Supabase dashboard):
 * - CREDIT_COST_1K: Cost for 1K image generation (default: 1)
 * - CREDIT_COST_2K: Cost for 2K image generation (default: 2)
 * - CREDIT_COST_4K: Cost for 4K image generation (default: 3)
 * - CREDIT_COST_LORA_TRAINING: Cost for LoRA training (default: 30)
 */

export type Resolution = '1K' | '2K' | '4K';

export interface CreditCosts {
  IMAGE_GENERATION: {
    [K in Resolution]: number;
  };
  LORA_TRAINING: number;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  maxResolution: Resolution;
  loraTrainingIncluded: number;
  concurrentJobs: number;
  maxLoras: number;
  features: string[];
  popular?: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  validityDays: number;
  costPerCredit: number;
  savings?: string;
}

/**
 * CONFIGURABLE CREDIT COSTS - reads from environment variables!
 * This is the main benefit - change pricing without code deployment
 */
export const CREDIT_COSTS: CreditCosts = {
  IMAGE_GENERATION: {
    '1K': parseInt(Deno.env.get('CREDIT_COST_1K') || '1'),
    '2K': parseInt(Deno.env.get('CREDIT_COST_2K') || '2'),
    '4K': parseInt(Deno.env.get('CREDIT_COST_4K') || '3')
  },
  LORA_TRAINING: parseInt(Deno.env.get('CREDIT_COST_LORA_TRAINING') || '30')
};

/**
 * Subscription tiers configuration
 * Note: These are kept in sync with @primeshot/common/lib/pricing-config
 */
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'tier_1',
    name: 'Starter',
    displayName: 'Starter',
    description: 'Perfect for individuals getting started with AI image generation',
    monthlyPrice: 9,
    yearlyPrice: 108,
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
      '1 Face Model max',
      'Up to 40×1K images'
    ],
    popular: false
  },
  {
    id: 'tier_2',
    name: 'Premium',
    displayName: 'Premium',
    description: 'Ideal for content creators and small businesses',
    monthlyPrice: 29,
    yearlyPrice: 348,
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
      '1 Face Model max',
      'Up to 180×1K or 90×2K or 60×4K images'
    ],
    popular: true
  },
  {
    id: 'tier_3',
    name: 'Pro',
    displayName: 'Pro',
    description: 'For agencies and high-volume users',
    monthlyPrice: 69,
    yearlyPrice: 828,
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

/**
 * Credit packs configuration
 * Note: These are kept in sync with @primeshot/common/lib/pricing-config
 */
export const CREDIT_PACKS: CreditPack[] = [
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

/**
 * Calculate credit cost for image generation
 */
export function calculateImageCreditCost(resolution: Resolution = '1K', batchSize: number = 1): number {
  return CREDIT_COSTS.IMAGE_GENERATION[resolution] * batchSize;
}

/**
 * Get credit cost for LoRA training
 */
export function getLoraTrainingCost(): number {
  return CREDIT_COSTS.LORA_TRAINING;
}

/**
 * Calculate total credit cost for any operation
 */
export function calculateCreditCost(
  operationType: 'image_generation' | 'lora_training',
  options?: { resolution?: Resolution; batchSize?: number }
): number {
  switch (operationType) {
    case 'image_generation':
      return calculateImageCreditCost(options?.resolution || '1K', options?.batchSize || 1);
    case 'lora_training':
      return getLoraTrainingCost();
    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}

/**
 * Version string to help with tracking pricing changes
 */
export const PRICING_VERSION = '2.0.0'; 