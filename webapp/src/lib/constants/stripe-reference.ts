// Stripe Price and Product ID Reference
// Generated on 2025-07-07T15:34:57.252Z
// This is the SINGLE SOURCE OF TRUTH for all Stripe price and product IDs

export const STRIPE_REFERENCE = {
  test: {
    subscriptions: {
      tier_1: {
        product: 'prod_SdYj2ZRvEyRFBu',
        monthly: 'price_1RiHbfENpyFv1vJeYK4gtcva',
        yearly: 'price_1RiHbfENpyFv1vJeVBwzmDMu'
      },
      tier_2: {
        product: 'prod_SdYjTEaOEjjqYC',
        monthly: 'price_1RiHbgENpyFv1vJeIXR0tjy9',
        yearly: 'price_1RiHbgENpyFv1vJe0eHZ1D6n'
      },
      tier_3: {
        product: 'prod_SdYjuHHqZ08LR1',
        monthly: 'price_1RiHbhENpyFv1vJe9KXvcBAG',
        yearly: 'price_1RiHbhENpyFv1vJeKjAOE3mE'
      }
    },
    
    creditPacks: {
      credits_90: {
        product: 'prod_SdYjy8BKuEQL9K',
        price: 'price_1RiHbhENpyFv1vJeRg0m07IR'
      },
      credits_180: {
        product: 'prod_SdYjatuJF1XdV1',
        price: 'price_1RiHbiENpyFv1vJeFHCMTvBW'
      },
      credits_360: {
        product: 'prod_SdYj6ksdXVT7gW',
        price: 'price_1RiHbjENpyFv1vJeP0AS4MtI'
      }
    }
  },
  
  production: {
    subscriptions: {
      tier_1: {
        product: 'prod_PROD_PLACEHOLDER_1',
        monthly: 'price_PROD_PLACEHOLDER_1_MONTHLY',
        yearly: 'price_PROD_PLACEHOLDER_1_YEARLY'
      },
      tier_2: {
        product: 'prod_PROD_PLACEHOLDER_2',
        monthly: 'price_PROD_PLACEHOLDER_2_MONTHLY',
        yearly: 'price_PROD_PLACEHOLDER_2_YEARLY'
      },
      tier_3: {
        product: 'prod_PROD_PLACEHOLDER_3',
        monthly: 'price_PROD_PLACEHOLDER_3_MONTHLY',
        yearly: 'price_PROD_PLACEHOLDER_3_YEARLY'
      }
    },
    
    creditPacks: {
      credits_90: {
        product: 'prod_PROD_CREDITS_90',
        price: 'price_PROD_CREDITS_90'
      },
      credits_180: {
        product: 'prod_PROD_CREDITS_180',
        price: 'price_PROD_CREDITS_180'
      },
      credits_360: {
        product: 'prod_PROD_CREDITS_360',
        price: 'price_PROD_CREDITS_360'
      }
    }
  }
}
