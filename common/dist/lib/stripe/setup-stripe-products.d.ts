#!/usr/bin/env node
/**
 * Script to programmatically create Stripe products and prices
 *
 * Usage:
 *   node setup-stripe-products.js                    # Uses .env.local (test mode)
 *   node setup-stripe-products.js --prod             # Uses .env (production mode)
 *   node setup-stripe-products.js --skip-cleanup     # Keep existing products
 *   node setup-stripe-products.js --prod --skip-cleanup  # Production + keep existing
 *
 * Requires STRIPE_SECRET_KEY and SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY environment variables
 */
declare function main(): Promise<void>;
export { main };
