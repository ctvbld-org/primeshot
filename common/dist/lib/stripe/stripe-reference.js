// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs
export const STRIPE_REFERENCE = {
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
