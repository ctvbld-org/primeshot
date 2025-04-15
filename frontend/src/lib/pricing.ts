/**
 * Pricing and headshot calculation utility functions
 */

export type PricingTier = 'individual' | 'professional' | 'studio';

export interface PricingInfo {
  tier: PricingTier;
  totalHeadshots: number;
  headshotsPerStyle: number;
  price: number;
  isAddOn: boolean;
}

const PRICING = {
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
 * Calculate the pricing tier and headshot allocation based on number of styles
 * Following the PRD logic:
 * - 1 style: 20 headshots (Individual Tier)
 * - 2-3 styles: 60 total headshots (Professional Tier)
 * - 4-6 styles: 120 total headshots (Studio Tier)
 * - 7+ styles: 120 + 20 per style over 6 (Studio Tier + add-ons)
 */
export function calculatePricing(styleCount: number): PricingInfo {
  if (styleCount <= 0) {
    throw new Error('Style count must be greater than 0');
  }

  // Individual tier (1 style)
  if (styleCount === 1) {
    return {
      tier: 'individual',
      totalHeadshots: PRICING.individual.totalHeadshots,
      headshotsPerStyle: PRICING.individual.headshotsPerStyle,
      price: PRICING.individual.price,
      isAddOn: false
    };
  }

  // Professional tier (2-3 styles)
  if (styleCount <= 3) {
    const headshotsPerStyle = Math.floor(PRICING.professional.totalHeadshots / styleCount);
    return {
      tier: 'professional',
      totalHeadshots: PRICING.professional.totalHeadshots,
      headshotsPerStyle,
      price: PRICING.professional.price,
      isAddOn: false
    };
  }

  // Studio tier (4-6 styles)
  if (styleCount <= 6) {
    const headshotsPerStyle = Math.floor(PRICING.studio.totalHeadshots / styleCount);
    return {
      tier: 'studio',
      totalHeadshots: PRICING.studio.totalHeadshots,
      headshotsPerStyle,
      price: PRICING.studio.price,
      isAddOn: false
    };
  }

  // Studio tier + add-ons (7+ styles)
  const additionalStyles = styleCount - 6;
  const additionalHeadshots = additionalStyles * PRICING.addon.headshots;
  const totalHeadshots = PRICING.studio.totalHeadshots + additionalHeadshots;
  const addonPrice = additionalStyles * PRICING.addon.price;
  
  return {
    tier: 'studio',
    totalHeadshots,
    headshotsPerStyle: 20, // Fixed at 20 per style for 7+
    price: PRICING.studio.price + addonPrice,
    isAddOn: true
  };
}

/**
 * Get display text for the pricing tier
 */
export function getTierDisplayText(tier: PricingTier): string {
  const tierMap: Record<PricingTier, string> = {
    individual: 'Individual',
    professional: 'Professional',
    studio: 'Studio'
  };
  
  return tierMap[tier];
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number): string {
  return `$${(price / 100).toFixed(2)}`;
} 