// Stripe Price and Product ID Reference
// Centralized source of truth for Stripe price and product IDs
export const STRIPE_REFERENCE = {
    dev: {
        subscriptions: {
            basic: { product: 'prod_TRKkuoIY2RgskI', monthly: 'price_1SUS5LENpyFv1vJeMAnMurkj', yearly: 'price_1SUS5LENpyFv1vJeuqcGVYUw' },
            standard: { product: 'prod_TRKkkWOuCxzHxw', monthly: 'price_1SUS5LENpyFv1vJeu2g7eYAp', yearly: 'price_1SUS5MENpyFv1vJejqZ6y5uH' },
            pro: { product: 'prod_TRKkuBC8SyTuY3', monthly: 'price_1SUS5MENpyFv1vJeD3rWV9QA', yearly: 'price_1SUS5NENpyFv1vJe30NFcw09' },
            ultimate: { product: 'prod_TRKkw6L93KQns0', monthly: 'price_1SUS5NENpyFv1vJeR4jzixZM', yearly: 'price_1SUS5OENpyFv1vJe6rseS2nX' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRKkSmlDY36yUr', price: 'price_1SUS5OENpyFv1vJeJWGLuuaR' },
            credits_276: { product: 'prod_TRKkXErMcGzqbi', price: 'price_1SUS5PENpyFv1vJexLRQlnjG' },
            credits_588: { product: 'prod_TRKkcDjIY8gAeB', price: 'price_1SUS5PENpyFv1vJexP2eim3N' },
            credits_1176: { product: 'prod_TRKk5P2UsVJ4qE', price: 'price_1SUS5QENpyFv1vJeKzDdQJyc' }
        }
    },
    staging: {
        subscriptions: {
            basic: { product: 'prod_TRKlaiYBM7pUPT', monthly: 'price_1SUS5jCyDXbv4ZSnkjQlSSeo', yearly: 'price_1SUS5jCyDXbv4ZSndc26A7yi' },
            standard: { product: 'prod_TRKlT1QmlA0wvQ', monthly: 'price_1SUS5kCyDXbv4ZSnpu3DobJq', yearly: 'price_1SUS5kCyDXbv4ZSnkbG7ZUVD' },
            pro: { product: 'prod_TRKlhaNLhFnVWJ', monthly: 'price_1SUS5lCyDXbv4ZSnUKuSfpZH', yearly: 'price_1SUS5lCyDXbv4ZSnbOidkAJz' },
            ultimate: { product: 'prod_TRKlLio4aXrBk9', monthly: 'price_1SUS5mCyDXbv4ZSnQliKszHQ', yearly: 'price_1SUS5mCyDXbv4ZSnS1OpJR5g' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRKlB0p3aJ4Q7B', price: 'price_1SUS5nCyDXbv4ZSn6ioI4t9F' },
            credits_276: { product: 'prod_TRKlFMpEPPg2Jp', price: 'price_1SUS5oCyDXbv4ZSnts3FlXaQ' },
            credits_588: { product: 'prod_TRKl5XLaRcYwtr', price: 'price_1SUS5oCyDXbv4ZSnVlmWhQf0' },
            credits_1176: { product: 'prod_TRKlF0VLz0nyG7', price: 'price_1SUS5pCyDXbv4ZSnzltGXdOe' }
        }
    },
    production: {
        subscriptions: {
            basic: { product: 'prod_TRKlXf9p4tW8cK', monthly: 'price_1SUS5yCyDXbv4ZSnwOGX0CBU', yearly: 'price_1SUS5yCyDXbv4ZSn6CK9THVL' },
            standard: { product: 'prod_TRKlB3pI1JccWE', monthly: 'price_1SUS5zCyDXbv4ZSnL9O5h0xM', yearly: 'price_1SUS5zCyDXbv4ZSnSuVFMfXm' },
            pro: { product: 'prod_TRKlDbtZp262X4', monthly: 'price_1SUS60CyDXbv4ZSn1o5Z6SZ7', yearly: 'price_1SUS60CyDXbv4ZSnuEJauznz' },
            ultimate: { product: 'prod_TRKlClnlY9W0bW', monthly: 'price_1SUS61CyDXbv4ZSnU3YDCqTZ', yearly: 'price_1SUS61CyDXbv4ZSngnccRFPd' }
        },
        creditPacks: {
            credits_138: { product: 'prod_TRKl9Bs3yh5jLg', price: 'price_1SUS62CyDXbv4ZSnMFZ9dVir' },
            credits_276: { product: 'prod_TRKlMjuvnnGNog', price: 'price_1SUS63CyDXbv4ZSnZi8bo2hX' },
            credits_588: { product: 'prod_TRKlJazZxIcKBK', price: 'price_1SUS63CyDXbv4ZSnwuPrUIgB' },
            credits_1176: { product: 'prod_TRKlIYIdHJ5KD8', price: 'price_1SUS64CyDXbv4ZSntVGSWKPr' }
        }
    }
};
