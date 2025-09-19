// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs

export type StripeEnv = 'dev' | 'staging' | 'production'

export const STRIPE_REFERENCE: Record<StripeEnv, any> = {
  dev: {
    subscriptions: {
      basic: { product: 'prod_T1nWSQDDD1xAas', monthly: 'price_1S5jvHENpyFv1vJeX3WgEfpp', yearly: 'price_1S5jvHENpyFv1vJey8rgTpDi' },
      standard: { product: 'prod_T1nWvWeO4WWXmK', monthly: 'price_1S5jvIENpyFv1vJeadKQvhIt', yearly: 'price_1S5jvIENpyFv1vJe9OXrGDF6' },
      pro: { product: 'prod_T1nWn8fhZbR3eX', monthly: 'price_1S5jvJENpyFv1vJePoxDjq5D', yearly: 'price_1S5jvJENpyFv1vJe7GMLoSXo' }
    },
    creditPacks: {
      credits_138: { product: 'prod_T1nWGkGn7vEjjY', price: 'price_1S5jvKENpyFv1vJeKa4rwAZf' },
      credits_276: { product: 'prod_T1nWlaMwKYarpp', price: 'price_1S5jvKENpyFv1vJetFwmhH7u' },
      credits_588: { product: 'prod_T1nWe6zdgyTE74', price: 'price_1S5jvLENpyFv1vJeaz3qTx2C' }
    }
  },
  staging: {
    subscriptions: {
      basic: { product: 'prod_T58ZlH02Bop8Lv', monthly: 'price_1S8yI3CyDXbv4ZSn1kcw86Yb', yearly: 'price_1S8yI3CyDXbv4ZSnVGKoXuQI' },
      standard: { product: 'prod_T58ZnjBvjLXabQ', monthly: 'price_1S8yI4CyDXbv4ZSnCsr6HSrI', yearly: 'price_1S8yI4CyDXbv4ZSn52fjyKLf' },
      pro: { product: 'prod_T58ZAvXL8HctUE', monthly: 'price_1S8yI5CyDXbv4ZSn9GspIzwq', yearly: 'price_1S8yI5CyDXbv4ZSnZkRFRPIM' }
    },
    creditPacks: {
      credits_138: { product: 'prod_T58ZyuRG7QR0de', price: 'price_1S8yI6CyDXbv4ZSnZUEry6aj' },
      credits_276: { product: 'prod_T58ZXyZvNoDrJ8', price: 'price_1S8yI7CyDXbv4ZSnBvuQuOZ6' },
      credits_588: { product: 'prod_T58ZCRlRxqbvNW', price: 'price_1S8yI7CyDXbv4ZSn1cQMmXbP' }
    }
  },
  production: {
    subscriptions: {
      basic: { product: '', monthly: '', yearly: '' },
      standard: { product: '', monthly: '', yearly: '' },
      pro: { product: '', monthly: '', yearly: '' }
    },
    creditPacks: {
      credits_138: { product: '', price: '' },
      credits_276: { product: '', price: '' },
      credits_588: { product: '', price: '' }
    }
  }
}


