// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs

export type StripeEnv = 'dev' | 'staging' | 'production'

export const STRIPE_REFERENCE: Record<StripeEnv, any> = {
  dev: {
    subscriptions: {
      basic: { product: 'prod_TGuWZ2BtijEuxK', monthly: 'price_1SKMh7ENpyFv1vJecgYJUOpY', yearly: 'price_1SKMh8ENpyFv1vJefjAFNWKL' },
      standard: { product: 'prod_TGuWMdKLe87qEH', monthly: 'price_1SKMh8ENpyFv1vJec1m5HpO0', yearly: 'price_1SKMh9ENpyFv1vJe84M5sPMN' },
      pro: { product: 'prod_TGuWouGVfQDOyK', monthly: 'price_1SKMh9ENpyFv1vJeEsjxqJX1', yearly: 'price_1SKMhAENpyFv1vJeDSicBSfj' }
    },
    creditPacks: {
      credits_138: { product: 'prod_TGuWLiHXkgy0i1', price: 'price_1SKMhAENpyFv1vJe6vfmII9w' },
      credits_276: { product: 'prod_TGuWgaiM1saHfJ', price: 'price_1SKMhBENpyFv1vJeWwQ44l5v' },
      credits_588: { product: 'prod_TGuWt46MTMiER4', price: 'price_1SKMhBENpyFv1vJeELkQ77NB' }
    }
  },
  staging: {
    subscriptions: {
      basic: { product: 'prod_T6qKtMI9mV5WXt', monthly: 'price_1SAceHCyDXbv4ZSn1G3a7r0I', yearly: 'price_1SAceHCyDXbv4ZSnIxSO3f5k' },
      standard: { product: 'prod_T6qKzKcxTo8BJP', monthly: 'price_1SAceICyDXbv4ZSnR2AmvgEL', yearly: 'price_1SAceICyDXbv4ZSnm9xswGzc' },
      pro: { product: 'prod_T6qK6R21aNm8oi', monthly: 'price_1SAceJCyDXbv4ZSneGjZ03uk', yearly: 'price_1SAceJCyDXbv4ZSnRQLSxWVc' }
    },
    creditPacks: {
      credits_138: { product: 'prod_T6qKzOuCPRWh4N', price: 'price_1SAceKCyDXbv4ZSnzwCOv8FC' },
      credits_276: { product: 'prod_T6qLTMwHHwBiqA', price: 'price_1SAceKCyDXbv4ZSnBZnlLei0' },
      credits_588: { product: 'prod_T6qLftWegJsFma', price: 'price_1SAceLCyDXbv4ZSnngsImtxQ' }
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


