#!/usr/bin/env node
/**
 * Script to programmatically create Stripe products and prices
 *
 * Usage:
 *   tsx common/lib/stripe/setup-stripe-products.ts                    # Uses .env.local (test mode)
 *   tsx common/lib/stripe/setup-stripe-products.ts --prod             # Uses .env (production mode)
 *   tsx common/lib/stripe/setup-stripe-products.ts --skip-cleanup     # Keep existing products
 *   tsx common/lib/stripe/setup-stripe-products.ts --prod --skip-cleanup  # Production + keep existing
 *
 * Requires STRIPE_SECRET_KEY and SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY environment variables
 */
declare function main(): Promise<void>;
export { main };
