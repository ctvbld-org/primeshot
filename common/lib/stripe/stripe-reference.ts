// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs

export type StripeEnv = 'dev' | 'staging' | 'production'

export const STRIPE_REFERENCE: Record<StripeEnv, any> = {
  dev: {
    subscriptions: {
      basic: { product: 'prod_TKGi3FiOrgAk0P', monthly: 'price_1SNcBMENpyFv1vJeiHLjkNrE', yearly: 'price_1SNcBMENpyFv1vJeYGKQ4wht' },
      standard: { product: 'prod_TKGiSdHA0lmUjj', monthly: 'price_1SNcBNENpyFv1vJeLfEGQy9W', yearly: 'price_1SNcBNENpyFv1vJeGK1pof00' },
      pro: { product: 'prod_TKGiKQn1MZ7YOy', monthly: 'price_1SNcBOENpyFv1vJe7icoe1MH', yearly: 'price_1SNcBOENpyFv1vJe7Uw0EWQf' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TKGiQWEuKQxjfC', price: 'price_1SNcBPENpyFv1vJeHNJf3zji' },
      credits_276: { product: 'prod_TKGizqhn5BSScs', price: 'price_1SNcBPENpyFv1vJeQbhCTK0t' },
      credits_588: { product: 'prod_TKGiUNowce4NBY', price: 'price_1SNcBQENpyFv1vJeO4ziweaf' }
    }
  },
  staging: {
    subscriptions: {
      basic: { product: 'prod_TJnxs3RNeh3KqF', monthly: 'price_1SNALiCyDXbv4ZSnFLxqXDca', yearly: 'price_1SNALjCyDXbv4ZSnec5wcJcA' },
      standard: { product: 'prod_TJnxg9WUSRjUVl', monthly: 'price_1SNALjCyDXbv4ZSn4u6sYzmB', yearly: 'price_1SNALkCyDXbv4ZSnlHcP39hO' },
      pro: { product: 'prod_TJnxqvvCaJsmcU', monthly: 'price_1SNALkCyDXbv4ZSnLz1V09sQ', yearly: 'price_1SNALkCyDXbv4ZSnMfYUZvB7' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TJnxFfmf0mRSQN', price: 'price_1SNALlCyDXbv4ZSnWPHK26yR' },
      credits_276: { product: 'prod_TJnxqX1dz6TU6Y', price: 'price_1SNALmCyDXbv4ZSng1O3YWir' },
      credits_588: { product: 'prod_TJnxwtDGcndhDn', price: 'price_1SNALmCyDXbv4ZSn55DUsMbU' }
    }
  },
  production: {
    subscriptions: {
      basic: { product: 'prod_T7eWbL0YCaTYJX', monthly: 'price_1SBPD7CyDXbv4ZSntNVBGOq3', yearly: 'price_1SBPD7CyDXbv4ZSndxLMx7Jc' },
      standard: { product: 'prod_T7eWf44VglXk8L', monthly: 'price_1SBPD8CyDXbv4ZSnRX0x2bAR', yearly: 'price_1SBPD9CyDXbv4ZSnkCsZr7Do' },
      pro: { product: 'prod_T7eWmlnxXvE2e2', monthly: 'price_1SBPD9CyDXbv4ZSn4Kz2HKPX', yearly: 'price_1SBPDACyDXbv4ZSnUtDkK3Q6' }
    },
    creditPacks: {
      credits_138: { product: 'prod_T7eWtPNj0uZoTB', price: 'price_1SBPDACyDXbv4ZSn3XERM8vh' },
      credits_276: { product: 'prod_T7eWMncLt7f6Ul', price: 'price_1SBPDBCyDXbv4ZSnRk1XfBsT' },
      credits_588: { product: 'prod_T7eWKLGH48WrjP', price: 'price_1SBPDCCyDXbv4ZSnYAxKYw4m' }
    }
  }
}


