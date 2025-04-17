/**
 * SHARED PRICING CONSTANTS
 * 
 * This file serves as the single source of truth for pricing information
 * across both frontend and Supabase Edge Functions.
 * 
 * IMPORTANT: When updating pricing, remember to deploy both frontend and
 * Edge Functions to maintain consistency between client and server.
 */

export type PricingTier = 'individual' | 'professional' | 'studio';

export interface PricingConstants {
  individual: {
    price: number;
    minStyles: number;
    maxStyles: number;
    headshotsPerStyle: number;
    totalHeadshots: number;
  };
  professional: {
    price: number;
    minStyles: number;
    maxStyles: number;
    totalHeadshots: number;
  };
  studio: {
    price: number;
    minStyles: number;
    maxStyles: number;
    totalHeadshots: number;
  };
  addon: {
    price: number;
    headshots: number;
  };
}

/**
 * Central pricing constants
 * All price values are in cents (e.g., 2900 = $29.00)
 */
export const PRICING: PricingConstants = {
  individual: {
    price: 2900, // $29
    minStyles: 1,
    maxStyles: 1,
    headshotsPerStyle: 20,
    totalHeadshots: 20
  },
  professional: {
    price: 4900, // $49
    minStyles: 2,
    maxStyles: 3,
    totalHeadshots: 60
  },
  studio: {
    price: 7900, // $79
    minStyles: 4,
    maxStyles: 6,
    totalHeadshots: 120
  },
  addon: {
    price: 1500, // $15 for additional 20 headshots
    headshots: 20
  }
};

/**
 * Calculates the price based on the number of styles.
 * This is a simpler version of the full pricing calculation
 * that only returns the price in cents.
 */
export function calculateSimplePrice(styleCount: number): number {
  if (styleCount <= 0) return 0;
  
  // Individual tier (1 style)
  if (styleCount === 1) {
    return PRICING.individual.price;
  }
  
  // Professional tier (2-3 styles)
  if (styleCount <= 3) {
    return PRICING.professional.price;
  }
  
  // Studio tier (4-6 styles)
  if (styleCount <= 6) {
    return PRICING.studio.price;
  }
  
  // Studio tier + add-ons (7+ styles)
  const additionalStyles = styleCount - 6;
  const addonPrice = additionalStyles * PRICING.addon.price;
  return PRICING.studio.price + addonPrice;
}

/**
 * Version string to help with tracking pricing changes
 * Increment this when modifying pricing structure
 */
export const PRICING_VERSION = '1.0.0';

/**
 * Use this comment block when copying to Edge Functions:
 * 
 * ```ts
 * // PRICING_VERSION: 1.0.0
 * // This is a copy of the frontend/src/lib/constants/pricing.ts file
 * // Last synchronized: ${new Date().toISOString()}
 * ```
 */ 