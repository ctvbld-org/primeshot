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
      basic: { product: 'prod_TRJC1rQsTPZRhY', monthly: 'price_1SUQZgCyDXbv4ZSnFHQjpfE0', yearly: 'price_1SUQZgCyDXbv4ZSngf1oJhoA' },
      standard: { product: 'prod_TRJCZn7ZRed2u7', monthly: 'price_1SUQZgCyDXbv4ZSnWENeN4DI', yearly: 'price_1SUQZhCyDXbv4ZSnjkwIyUy4' },
      pro: { product: 'prod_TRJCoeHmjHPhUY', monthly: 'price_1SUQZhCyDXbv4ZSnNikxXc4E', yearly: 'price_1SUQZiCyDXbv4ZSnsQioCYj7' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TRJC9da38TXcvd', price: 'price_1SUQZjCyDXbv4ZSnmzLgq1ew' },
      credits_276: { product: 'prod_TRJCg04eOpdDkn', price: 'price_1SUQZkCyDXbv4ZSncJ2QkYv3' },
      credits_588: { product: 'prod_TRJCwEeNQ9YE1v', price: 'price_1SUQZkCyDXbv4ZSnV7zpb71v' }
    }
  },
  production: {
    subscriptions: {
      basic: { product: 'prod_TRJDI8iPBzb8Pe', monthly: 'price_1SUQb7CyDXbv4ZSnzaVVKBUI', yearly: 'price_1SUQb8CyDXbv4ZSn4vnDSbnl' },
      standard: { product: 'prod_TRJDARLe88bsw7', monthly: 'price_1SUQb8CyDXbv4ZSnFtonxzkF', yearly: 'price_1SUQb9CyDXbv4ZSnSNl3XkBe' },
      pro: { product: 'prod_TRJDPN53tV1FAo', monthly: 'price_1SUQb9CyDXbv4ZSnYKh4Y20b', yearly: 'price_1SUQbACyDXbv4ZSnZkymv4Gh' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TRJDceHtaEZhNG', price: 'price_1SUQbBCyDXbv4ZSnNFCffG8A' },
      credits_276: { product: 'prod_TRJDGCbqzSqb5v', price: 'price_1SUQbCCyDXbv4ZSnjMhFaovN' },
      credits_588: { product: 'prod_TRJDVF8rjCazyN', price: 'price_1SUQbCCyDXbv4ZSno0Dib9Fj' }
    }
  }
}


