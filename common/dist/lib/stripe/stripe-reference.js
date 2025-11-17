// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs
export const STRIPE_REFERENCE = {
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
};
