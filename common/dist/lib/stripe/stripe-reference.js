// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs
export const STRIPE_REFERENCE = {
    dev: {
        subscriptions: {
            basic: { product: 'prod_TRK9rucqY8pVTi', monthly: 'price_1SURUyENpyFv1vJeg44iB7zW', yearly: 'price_1SURUyENpyFv1vJegISwmmGv' },
            standard: { product: 'prod_TRK9eW06lZc9g7', monthly: 'price_1SURUzENpyFv1vJeDLqBZvJ2', yearly: 'price_1SURUzENpyFv1vJekEMQIK1p' },
            pro: { product: 'prod_TRK9kDVGkvGBUX', monthly: 'price_1SURV0ENpyFv1vJeTsf8MD3n', yearly: 'price_1SURV0ENpyFv1vJeFqpLPLok' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRK9Vhx53ZK1F8', price: 'price_1SURV1ENpyFv1vJexGPPfm37' },
            credits_276: { product: 'prod_TRK9DVC50te3OS', price: 'price_1SURV2ENpyFv1vJeLyJJYIex' },
            credits_588: { product: 'prod_TRK9GVaAuKCIpv', price: 'price_1SURV3ENpyFv1vJeiRkzCZRh' }
        }
    },
    staging: {
        subscriptions: {
            basic: { product: 'prod_TRK8muDVmawwWT', monthly: 'price_1SURUWCyDXbv4ZSnG2jUBHSD', yearly: 'price_1SURUWCyDXbv4ZSnDX3R3hKI' },
            standard: { product: 'prod_TRK8s8bBSOUukg', monthly: 'price_1SURUWCyDXbv4ZSnMlr2NQxM', yearly: 'price_1SURUXCyDXbv4ZSnDWZAECgu' },
            pro: { product: 'prod_TRK8Vn5AK2GTyD', monthly: 'price_1SURUXCyDXbv4ZSnavWbqWNa', yearly: 'price_1SURUYCyDXbv4ZSnSvy0Hzow' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRK8u88pXhmfOw', price: 'price_1SURUZCyDXbv4ZSnHo68sB4W' },
            credits_276: { product: 'prod_TRK8PB8OX4cHNj', price: 'price_1SURUaCyDXbv4ZSnJYy77iD3' },
            credits_588: { product: 'prod_TRK8YgsiMC6ZgN', price: 'price_1SURUaCyDXbv4ZSnqdeQLkGY' }
        }
    },
    production: {
        subscriptions: {
            basic: { product: 'prod_TRKHJFcSlsV2qV', monthly: 'price_1SURcTCyDXbv4ZSnl88sKUjw', yearly: 'price_1SURcUCyDXbv4ZSnkNUT0lES' },
            standard: { product: 'prod_TRKHstq6a4xxyZ', monthly: 'price_1SURcUCyDXbv4ZSnrCBbBbVw', yearly: 'price_1SURcVCyDXbv4ZSnO3oKbQoa' },
            pro: { product: 'prod_TRKHyRzNLm02du', monthly: 'price_1SURcVCyDXbv4ZSn8zNl1C8W', yearly: 'price_1SURcWCyDXbv4ZSnIrmtvFp3' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRKH1tdMM39F02', price: 'price_1SURcXCyDXbv4ZSnO3aoCzno' },
            credits_276: { product: 'prod_TRKHd27do23N92', price: 'price_1SURcYCyDXbv4ZSnPwYdkPU3' },
            credits_588: { product: 'prod_TRKHeZCZlnKwua', price: 'price_1SURcYCyDXbv4ZSnecUNJGL4' }
        }
    }
};
