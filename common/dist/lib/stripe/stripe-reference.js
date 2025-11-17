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
            basic: { product: 'prod_TRI5Hb9AXbnFRf', monthly: 'price_1SUPVOCyDXbv4ZSniyqGSJLj', yearly: 'price_1SUPVOCyDXbv4ZSnUba0sdTG' },
            standard: { product: 'prod_TRI5v6o98g5tY9', monthly: 'price_1SUPVPCyDXbv4ZSnV7pbtVrz', yearly: 'price_1SUPVPCyDXbv4ZSnIOb4Q07C' },
            pro: { product: 'prod_TRI5whnDlpCwAY', monthly: 'price_1SUPVQCyDXbv4ZSn8UtXndRG', yearly: 'price_1SUPVQCyDXbv4ZSn4TUvbwu2' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRI5uCpOGki6Sp', price: 'price_1SUPVQCyDXbv4ZSn6IVeF9Kf' },
            credits_276: { product: 'prod_TRI5fIhgou9nlj', price: 'price_1SUPVRCyDXbv4ZSnhujFjeM9' },
            credits_588: { product: 'prod_TRI5BwBz49zGxh', price: 'price_1SUPVSCyDXbv4ZSnq1DDwf5T' }
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
};
