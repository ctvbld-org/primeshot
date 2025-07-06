/**
 * Shared pricing configuration
 * This file is imported by both pricing.ts and setup-stripe-products.js
 * to ensure consistency and avoid duplication
 */

export const SUBSCRIPTION_TIERS_CONFIG = [
  {
    id: 'tier_1',
    name: 'Starter',
    displayName: 'Starter',
    description: 'Perfect for individuals getting started with AI image generation',
    monthlyPrice: 9,
    yearlyPrice: 108, // Total yearly price
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
    yearlyPrice: 348, // Total yearly price
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
    yearlyPrice: 828, // Total yearly price
    credits: 360,
    maxResolution: '4K',
    loraTrainingIncluded: 3,
    concurrentJobs: 4,
    maxLoras: 8,
    features: [
      '360 credits per month',
      'Up to 4K resolution',
      '3 Face Model training included',
      '4 concurrent jobs',
      '8 max Face Models',
      'Up to 360×1K or 180×2K or 120×4K images'
    ],
    popular: false
  }
]

export const CREDIT_PACKS_CONFIG = [
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
]

// Credit costs for different operations
export const CREDIT_COSTS_CONFIG = {
  IMAGE_GENERATION: {
    '1K': 1,
    '2K': 2,
    '4K': 3
  },
  LORA_TRAINING: 30
} 