import { SubscriptionTier, PricingCategory } from './types'

// Hardcoded data for features not in database
const HARDCODED_FEATURES = {
  aspect_ratios: {
    free: { portrait: false, square: true, landscape: false },
    basic: { portrait: false, square: true, landscape: false },
    standard: { portrait: true, square: true, landscape: true },
    pro: { portrait: true, square: true, landscape: true },
    ultimate: { portrait: true, square: true, landscape: true }
  },
  support_features: {
    free: { email: true, chat: false, dedicated: false },
    basic: { email: true, chat: false, dedicated: false },
    standard: { email: true, chat: true, dedicated: false },
    pro: { email: true, chat: true, dedicated: true },
    ultimate: { email: true, chat: true, dedicated: true }
  },
  feature_flags: {
    free: { commercial_use: false, priority_features: false, premium_styles: false, beta_access: false },
    basic: { commercial_use: true, priority_features: false, premium_styles: false, beta_access: false },
    standard: { commercial_use: true, priority_features: true, premium_styles: true, beta_access: false },
    pro: { commercial_use: true, priority_features: true, premium_styles: true, beta_access: true },
    ultimate: { commercial_use: true, priority_features: true, premium_styles: true, beta_access: true }
  }
}

/**
 * Transforms database subscriptions into pricing table format
 * Uses DB data where available and hardcoded data for missing fields
 */
export function transformPricingData(subscriptions: SubscriptionTier[]): PricingCategory[] {
  // Sort subscriptions by price to ensure consistent ordering
  const sortedSubs = [...subscriptions].sort((a, b) => a.monthly_price - b.monthly_price)
  
  // Find each tier
  const free = sortedSubs.find(s => s.name === 'free')
  const basic = sortedSubs.find(s => s.name === 'basic')
  const standard = sortedSubs.find(s => s.name === 'standard')
  const pro = sortedSubs.find(s => s.name === 'pro')
  const ultimate = sortedSubs.find(s => s.name === 'ultimate')

  if (!free || !basic || !standard || !pro || !ultimate) {
    console.warn('Missing subscription tiers', { free: !!free, basic: !!basic, standard: !!standard, pro: !!pro, ultimate: !!ultimate })
    return []
  }

  // Helper to format price per credit
  const pricePerCredit = (price: number, credits: number, characterTrainingIncluded: number) => {
    // Adjust credits to account for character training included (30 credits per character)
    const adjustedCredits = credits
    return `$${(price / adjustedCredits).toFixed(2)}`
  }

  // Helper for checkmark
  const check = (value: boolean) => value ? '✓' : ''

  // Helper for resolution display
  const formatResolution = (quality: string) => {
    return quality === '1K'
      ? "comparisonTable.values.basicQuality"
      : "comparisonTable.values.highQuality"
  }

  return [
    {
      category: "comparisonTable.categories.credits",
      features: [
        {
          name: "comparisonTable.features.creditsPerMonth",
          free: String(free.credits),
          basic: String(basic.credits),
          standard: String(standard.credits),
          pro: String(pro.credits),
          ultimate: String(ultimate.credits)
        },
        {
          name: "comparisonTable.features.pricePerCredit",
          free: pricePerCredit(free.monthly_price, free.credits, free.character_training_included),
          basic: pricePerCredit(basic.monthly_price, basic.credits, basic.character_training_included),
          standard: pricePerCredit(standard.monthly_price, standard.credits, standard.character_training_included),
          pro: pricePerCredit(pro.monthly_price, pro.credits, pro.character_training_included),
          ultimate: pricePerCredit(ultimate.monthly_price, ultimate.credits, ultimate.character_training_included)
        }
      ]
    },
    {
      category: "comparisonTable.categories.image",
      features: [
        {
          name: "comparisonTable.features.resolution",
          free: formatResolution(free.max_quality),
          basic: formatResolution(basic.max_quality),
          standard: formatResolution(standard.max_quality),
          pro: formatResolution(pro.max_quality),
          ultimate: formatResolution(ultimate.max_quality)
        },
        {
          name: "comparisonTable.features.portraitAspectRatio",
          free: check(HARDCODED_FEATURES.aspect_ratios.free.portrait),
          basic: check(HARDCODED_FEATURES.aspect_ratios.basic.portrait),
          standard: check(HARDCODED_FEATURES.aspect_ratios.standard.portrait),
          pro: check(HARDCODED_FEATURES.aspect_ratios.pro.portrait),
          ultimate: check(HARDCODED_FEATURES.aspect_ratios.ultimate.portrait)
        },
        {
          name: "comparisonTable.features.squareAspectRatio",
          free: check(HARDCODED_FEATURES.aspect_ratios.free.square),
          basic: check(HARDCODED_FEATURES.aspect_ratios.basic.square),
          standard: check(HARDCODED_FEATURES.aspect_ratios.standard.square),
          pro: check(HARDCODED_FEATURES.aspect_ratios.pro.square),
          ultimate: check(HARDCODED_FEATURES.aspect_ratios.ultimate.square)
        },
        {
          name: "comparisonTable.features.landscapeAspectRatio",
          free: check(HARDCODED_FEATURES.aspect_ratios.free.landscape),
          basic: check(HARDCODED_FEATURES.aspect_ratios.basic.landscape),
          standard: check(HARDCODED_FEATURES.aspect_ratios.standard.landscape),
          pro: check(HARDCODED_FEATURES.aspect_ratios.pro.landscape),
          ultimate: check(HARDCODED_FEATURES.aspect_ratios.ultimate.landscape)
        }
      ]
    },
    {
      category: "comparisonTable.categories.characters",
      features: [
        {
          name: "comparisonTable.features.included",
          free: String(free.character_training_included),
          basic: String(basic.character_training_included),
          standard: String(standard.character_training_included),
          pro: String(pro.character_training_included),
          ultimate: String(ultimate.character_training_included)
        },
        {
          name: "comparisonTable.features.storage",
          free: String(free.max_characters),
          basic: String(basic.max_characters),
          standard: `Upto ${standard.max_characters}`,
          pro: `Upto ${pro.max_characters}`,
          ultimate: `Upto ${ultimate.max_characters}`
        }
      ]
    },
    {
      category: "comparisonTable.categories.generation",
      features: [
        {
          name: "comparisonTable.features.concurrentShoots",
          free: String(free.concurrent_jobs),
          basic: String(basic.concurrent_jobs),
          standard: String(standard.concurrent_jobs),
          pro: String(pro.concurrent_jobs),
          ultimate: String(ultimate.concurrent_jobs)
        },
        {
          name: "comparisonTable.features.commercialUse",
          free: check(HARDCODED_FEATURES.feature_flags.free.commercial_use),
          basic: check(HARDCODED_FEATURES.feature_flags.basic.commercial_use),
          standard: check(HARDCODED_FEATURES.feature_flags.standard.commercial_use),
          pro: check(HARDCODED_FEATURES.feature_flags.pro.commercial_use),
          ultimate: check(HARDCODED_FEATURES.feature_flags.ultimate.commercial_use)
        },
        {
          name: "comparisonTable.features.priorityFeatures",
          free: check(HARDCODED_FEATURES.feature_flags.free.priority_features),
          basic: check(HARDCODED_FEATURES.feature_flags.basic.priority_features),
          standard: check(HARDCODED_FEATURES.feature_flags.standard.priority_features),
          pro: check(HARDCODED_FEATURES.feature_flags.pro.priority_features),
          ultimate: check(HARDCODED_FEATURES.feature_flags.ultimate.priority_features)
        },
        {
          name: "comparisonTable.features.premiumStyles",
          free: check(HARDCODED_FEATURES.feature_flags.free.premium_styles),
          basic: check(HARDCODED_FEATURES.feature_flags.basic.premium_styles),
          standard: check(HARDCODED_FEATURES.feature_flags.standard.premium_styles),
          pro: check(HARDCODED_FEATURES.feature_flags.pro.premium_styles),
          ultimate: check(HARDCODED_FEATURES.feature_flags.ultimate.premium_styles)
        },
        {
          name: "comparisonTable.features.betaAccess",
          free: check(HARDCODED_FEATURES.feature_flags.free.beta_access),
          basic: check(HARDCODED_FEATURES.feature_flags.basic.beta_access),
          standard: check(HARDCODED_FEATURES.feature_flags.standard.beta_access),
          pro: check(HARDCODED_FEATURES.feature_flags.pro.beta_access),
          ultimate: check(HARDCODED_FEATURES.feature_flags.ultimate.beta_access)
        }
      ]
    },
    {
      category: "comparisonTable.categories.support",
      features: [
        {
          name: "comparisonTable.features.emailSupport",
          free: check(HARDCODED_FEATURES.support_features.free.email),
          basic: check(HARDCODED_FEATURES.support_features.basic.email),
          standard: check(HARDCODED_FEATURES.support_features.standard.email),
          pro: check(HARDCODED_FEATURES.support_features.pro.email),
          ultimate: check(HARDCODED_FEATURES.support_features.ultimate.email)
        },
        {
          name: "comparisonTable.features.chatSupport",
          free: check(HARDCODED_FEATURES.support_features.free.chat),
          basic: check(HARDCODED_FEATURES.support_features.basic.chat),
          standard: check(HARDCODED_FEATURES.support_features.standard.chat),
          pro: check(HARDCODED_FEATURES.support_features.pro.chat),
          ultimate: check(HARDCODED_FEATURES.support_features.ultimate.chat)
        },
        {
          name: "comparisonTable.features.dedicatedSupport",
          free: check(HARDCODED_FEATURES.support_features.free.dedicated),
          basic: check(HARDCODED_FEATURES.support_features.basic.dedicated),
          standard: check(HARDCODED_FEATURES.support_features.standard.dedicated),
          pro: check(HARDCODED_FEATURES.support_features.pro.dedicated),
          ultimate: check(HARDCODED_FEATURES.support_features.ultimate.dedicated)
        }
      ]
    }
  ]
}

