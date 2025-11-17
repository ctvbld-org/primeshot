// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs

export type StripeEnv = 'dev' | 'staging' | 'production'

export const STRIPE_REFERENCE: Record<StripeEnv, any> = {
  dev: {
    subscriptions: {
      basic: { product: 'prod_TRHCSPHjAlhPBf', monthly: 'price_1SUOdcENpyFv1vJewEkplyLS', yearly: 'price_1SUOdcENpyFv1vJeClZIwpmy' },
      standard: { product: 'prod_TRHCdX6waqgmwT', monthly: 'price_1SUOddENpyFv1vJeBnR8JFWl', yearly: 'price_1SUOddENpyFv1vJelxXSZnkl' },
      pro: { product: 'prod_TRHCqnZoycCd6l', monthly: 'price_1SUOddENpyFv1vJeJJb6AF9X', yearly: 'price_1SUOdeENpyFv1vJeMvYDMxed' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TRHCjrNZICz67b', price: 'price_1SUOdfENpyFv1vJesAM5FNTl' },
      credits_276: { product: 'prod_TRHC5vyLWgQPiD', price: 'price_1SUOdgENpyFv1vJeCQQFJDsN' },
      credits_588: { product: 'prod_TRHCy5RMf25bIv', price: 'price_1SUOdgENpyFv1vJeYByM0dC5' }
    }
  },
  staging: {
    subscriptions: {
      basic: { product: 'prod_TRIa4qWejSnH7F', monthly: 'price_1SUPzkCyDXbv4ZSnOmCSpVcL', yearly: 'price_1SUPzkCyDXbv4ZSniNnk4YUE' },
      standard: { product: 'prod_TRIaDzPSIvduZV', monthly: 'price_1SUPzlCyDXbv4ZSnynqFfZpY', yearly: 'price_1SUPzlCyDXbv4ZSnwTSrUtoP' },
      pro: { product: 'prod_TRIa0cq8nFDWGU', monthly: 'price_1SUPzmCyDXbv4ZSnlIwKBlPW', yearly: 'price_1SUPzmCyDXbv4ZSnZA8oscMz' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TRIaZrTK6WBmqp', price: 'price_1SUPzoCyDXbv4ZSn3SvHHqMr' },
      credits_276: { product: 'prod_TRIbtHxUhszXY8', price: 'price_1SUPzoCyDXbv4ZSnnNouM2O3' },
      credits_588: { product: 'prod_TRIbXvaEMadas3', price: 'price_1SUPzpCyDXbv4ZSngsUdOuYl' }
    }
  },
  production: {
    subscriptions: {
      basic: { product: 'prod_TKNMPSqH0pC0m7', monthly: 'price_1SNibrCyDXbv4ZSnost4Y4rP', yearly: 'price_1SNibsCyDXbv4ZSneW4echDi' },
      standard: { product: 'prod_TKNMZerJmdSzRy', monthly: 'price_1SNibsCyDXbv4ZSngX0q3mJl', yearly: 'price_1SNibtCyDXbv4ZSnPcYgIKGP' },
      pro: { product: 'prod_TKNMoLUrEt4N3a', monthly: 'price_1SNibtCyDXbv4ZSnkN8UsCfL', yearly: 'price_1SNibtCyDXbv4ZSnnm55AB6j' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TKNMKj1JrGMMBw', price: 'price_1SNibuCyDXbv4ZSnQxFcwJ1d' },
      credits_276: { product: 'prod_TKNMcFvhzlgtzB', price: 'price_1SNibvCyDXbv4ZSnYfaF4cZB' },
      credits_588: { product: 'prod_TKNMV4BbK7mCYD', price: 'price_1SNibvCyDXbv4ZSnTCMNFBJX' }
    }
  }
}


