// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs
export const STRIPE_REFERENCE = {
    dev: {
        subscriptions: {
            basic: { product: 'prod_T6oQ76DTKteA0v', monthly: 'price_1SAannENpyFv1vJeYLaMW20Z', yearly: 'price_1SAannENpyFv1vJe8EXHTmSz' },
            standard: { product: 'prod_T6oQI13g8ly1Kn', monthly: 'price_1SAanoENpyFv1vJeePCdDhz6', yearly: 'price_1SAanoENpyFv1vJe4rf86MVP' },
            pro: { product: 'prod_T6oQp8L3R9DeE3', monthly: 'price_1SAanpENpyFv1vJe9bjPslJm', yearly: 'price_1SAanpENpyFv1vJeRFPE6zRv' }
        },
        creditPacks: {
            credits_138: { product: 'prod_T6oQiWTNj17A8K', price: 'price_1SAanqENpyFv1vJeioXXDaqO' },
            credits_276: { product: 'prod_T6oQKDT2aQDkxr', price: 'price_1SAanrENpyFv1vJemQtPTA8G' },
            credits_588: { product: 'prod_T6oQQ4Jv76EI4N', price: 'price_1SAanrENpyFv1vJebyuTmMvM' }
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
};
