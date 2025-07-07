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
 * Requires STRIPE_SECRET_KEY environment variable in the appropriate .env file
 */

import Stripe from 'stripe'
import { SUBSCRIPTION_TIERS_CONFIG, CREDIT_PACKS_CONFIG } from './pricing-config.js'
import dotenv from 'dotenv'

// Parse command line arguments
const args = process.argv.slice(2)
const environment = args.includes('--prod') ? 'prod' : 'test'
const skipCleanup = args.includes('--skip-cleanup')

// Load appropriate environment file
if (environment === 'prod') {
  console.log('🔴 PRODUCTION MODE - Using .env file')
  dotenv.config({ path: '.env' })
} else {
  console.log('🟡 TEST MODE - Using .env.local file')
  dotenv.config({ path: '.env.local' })
}

console.log(`Environment: ${environment}`)
console.log(`Stripe Key: ${process.env.STRIPE_SECRET_KEY ? 'Found' : 'Missing'}\n`)

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables')
  console.error(`Please create a ${environment === 'prod' ? '.env' : '.env.local'} file with:`)
  console.error('STRIPE_SECRET_KEY=sk_test_your_key_here')
  process.exit(1)
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
})

// Cleanup existing products before creating new ones
async function cleanupExistingProducts() {
  console.log('🧹 Cleaning up existing Primeshot products...\n')
  
  try {
    // Get all products (including archived ones)
    const products = await stripe.products.list({ limit: 100 })
    
    // Filter for Primeshot products (by name pattern or metadata)
    const primeshotProducts = products.data.filter(product => 
      product.active && ( // Only target active products
        product.name.includes('Primeshot') || 
        product.name.includes('Credits') ||
        (product.metadata && (product.metadata.tier_type === 'subscription' || product.metadata.tier_type === 'credit_pack'))
      )
    )
    
    if (primeshotProducts.length === 0) {
      console.log('✅ No existing active Primeshot products found to clean up\n')
      return
    }
    
    console.log(`Found ${primeshotProducts.length} existing active Primeshot products to archive:`)
    
    let cleanedCount = 0
    
    // Archive each product and its prices
    for (const product of primeshotProducts) {
      try {
        console.log(`  📦 Archiving: ${product.name} (${product.id})`)
        
        // First, deactivate all prices for this product
        const prices = await stripe.prices.list({ product: product.id, limit: 100 })
        for (const price of prices.data) {
          if (price.active) {
            await stripe.prices.update(price.id, { active: false })
            console.log(`    🚫 Deactivated price: ${price.id}`)
          }
        }
        
        // Then archive the product (makes it inactive but preserves it)
        await stripe.products.update(product.id, { active: false })
        console.log(`    ✅ Archived product: ${product.id}`)
        cleanedCount++
        
      } catch (error) {
        console.warn(`    ⚠️  Failed to archive ${product.name}: ${error.message}`)
      }
    }
    
    console.log(`\n✅ Cleanup completed - archived ${cleanedCount} products and their prices\n`)
    
  } catch (error) {
    console.warn(`⚠️  Cleanup failed: ${error.message}`)
    console.log('Continuing with product creation...\n')
  }
}

// Convert pricing.ts data to Stripe-compatible format
function convertTierForStripe(tier) {
  return {
    id: tier.id,
    name: tier.name,
    description: tier.description,
    monthlyPrice: tier.monthlyPrice,
    yearlyPrice: tier.yearlyPrice,
    credits: tier.credits,
    maxResolution: tier.maxResolution,
    loraTrainingIncluded: tier.loraTrainingIncluded,
    concurrentJobs: tier.concurrentJobs,
    maxLoras: tier.maxLoras
  }
}

function convertPackForStripe(pack) {
  return {
    id: pack.id,
    name: pack.name,
    credits: pack.credits,
    price: pack.price,
    validityDays: pack.validityDays
  }
}

async function createSubscriptionProducts() {
  console.log('🚀 Creating subscription products...\n')
  
  const results = []
  
  for (const tierData of SUBSCRIPTION_TIERS_CONFIG) {
    const tier = convertTierForStripe(tierData)
    try {
      // Create product
      console.log(`Creating product: ${tier.name}`)
      const product = await stripe.products.create({
        name: `Primeshot ${tier.name}`,
        description: tier.description,
        type: 'service',
        metadata: {
          plan_name: tier.id,
          credits_included: tier.credits.toString(),
          max_resolution: tier.maxResolution,
          lora_training_included: tier.loraTrainingIncluded.toString(),
          concurrent_jobs: tier.concurrentJobs.toString(),
          max_loras: tier.maxLoras.toString(),
          tier_type: 'subscription'
        }
      })
      
      // Create monthly price
      console.log(`Creating monthly price: $${tier.monthlyPrice}`)
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.monthlyPrice * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          billing_cycle: 'monthly',
          plan_name: tier.id
        }
      })
      
      // Create yearly price (if available)
      let yearlyPrice = null
      if (tier.yearlyPrice) {
        const yearlyTotal = tierData.yearlyPrice * 12 // yearlyPrice is per month, multiply by 12
        console.log(`Creating yearly price: $${yearlyTotal} (${tierData.yearlyPrice}/month × 12)`)
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: yearlyTotal * 100, // Convert to cents
          currency: 'usd', 
          recurring: {
            interval: 'year'
          },
          metadata: {
            billing_cycle: 'yearly',
            plan_name: tier.id
          }
        })
      }
      
      results.push({
        tier: tier.id,
        product: product.id,
        monthlyPrice: monthlyPrice.id,
        yearlyPrice: yearlyPrice ? yearlyPrice.id : null
      })
      
      console.log(`✅ ${tier.name} created successfully\n`)
      
    } catch (error) {
      console.error(`❌ Failed to create ${tier.name}:`, error.message)
    }
  }
  
  return results
}

async function createCreditPackProducts() {
  console.log('💳 Creating credit pack products...\n')
  
  const results = []
  
  for (const packData of CREDIT_PACKS_CONFIG) {
    const pack = convertPackForStripe(packData)
    try {
      // Create product
      console.log(`Creating credit pack: ${pack.name}`)
      const product = await stripe.products.create({
        name: `${pack.name}`,
        description: `${pack.credits.toLocaleString()} credits for image generation and Face Model training. Valid for ${pack.validityDays} days.`,
        type: 'service',
        metadata: {
          credits: pack.credits.toString(),
          validity_days: pack.validityDays.toString(),
          pack_id: pack.id,
          tier_type: 'credit_pack'
        }
      })
      
      // Create one-time price
      console.log(`Creating price: $${pack.price}`)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          pack_id: pack.id,
          credits: pack.credits.toString()
        }
      })
      
      results.push({
        pack: pack.id,
        product: product.id,
        price: price.id
      })
      
      console.log(`✅ ${pack.name} created successfully\n`)
      
    } catch (error) {
      console.error(`❌ Failed to create ${pack.name}:`, error.message)
    }
  }
  
  return results
}

async function updatePricingFile(subscriptionResults, creditPackResults) {
  console.log('📝 Updating stripe-reference.ts with Stripe price IDs...\n')
  
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  const stripeRefPath = path.join(__dirname, '../webapp/src/lib/constants/stripe-reference.ts')
  
  // Determine which environment we're updating
  const isProduction = process.argv.includes('--prod')
  const envKey = isProduction ? 'production' : 'test'
  
  console.log(`📝 Updating ${envKey} environment price IDs...`)
  
  let content
  if (fs.existsSync(stripeRefPath)) {
    content = fs.readFileSync(stripeRefPath, 'utf8')
    
    // Update existing file - replace the specific environment
    for (const result of subscriptionResults) {
      // Replace monthly price ID
      const monthlyPattern = new RegExp(
        `(${envKey}:[\\s\\S]*?subscriptions:[\\s\\S]*?${result.tier}:[\\s\\S]*?monthly: ')([^']*)'`,
        'g'
      )
      content = content.replace(monthlyPattern, `$1${result.monthlyPrice}'`)
      
      // Replace yearly price ID (if available)
      if (result.yearlyPrice) {
        const yearlyPattern = new RegExp(
          `(${envKey}:[\\s\\S]*?subscriptions:[\\s\\S]*?${result.tier}:[\\s\\S]*?yearly: ')([^']*)'`,
          'g'
        )
        content = content.replace(yearlyPattern, `$1${result.yearlyPrice}'`)
      }
      
      // Replace product ID
      const productPattern = new RegExp(
        `(${envKey}:[\\s\\S]*?subscriptions:[\\s\\S]*?${result.tier}:[\\s\\S]*?product: ')([^']*)'`,
        'g'
      )
      content = content.replace(productPattern, `$1${result.product}'`)
    }
    
    // Update credit pack price IDs for the current environment
    for (const result of creditPackResults) {
      // Replace price ID
      const pricePattern = new RegExp(
        `(${envKey}:[\\s\\S]*?creditPacks:[\\s\\S]*?${result.pack}:[\\s\\S]*?price: ')([^']*)'`,
        'g'
      )
      content = content.replace(pricePattern, `$1${result.price}'`)
      
      // Replace product ID
      const productPattern = new RegExp(
        `(${envKey}:[\\s\\S]*?creditPacks:[\\s\\S]*?${result.pack}:[\\s\\S]*?product: ')([^']*)'`,
        'g'
      )
      content = content.replace(productPattern, `$1${result.product}'`)
    }
  } else {
    // Create new file with both environments
    console.log('📝 Creating new stripe-reference.ts file...')
    
    const createEnvironmentData = (env) => {
      const isCurrentEnv = env === envKey
      return `  ${env}: {
    subscriptions: {
${subscriptionResults.map(tier => `      ${tier.tier}: {
        product: '${isCurrentEnv ? tier.product : `prod_${env.toUpperCase()}_PLACEHOLDER_${tier.tier.split('_')[1]}`}',
        monthly: '${isCurrentEnv ? tier.monthlyPrice : `price_${env.toUpperCase()}_PLACEHOLDER_${tier.tier.split('_')[1]}_MONTHLY`}',
        yearly: '${isCurrentEnv && tier.yearlyPrice ? tier.yearlyPrice : `price_${env.toUpperCase()}_PLACEHOLDER_${tier.tier.split('_')[1]}_YEARLY`}'
      }`).join(',\n')}
    },
    
    creditPacks: {
${creditPackResults.map(pack => `      ${pack.pack}: {
        product: '${isCurrentEnv ? pack.product : `prod_${env.toUpperCase()}_${pack.pack.toUpperCase()}`}',
        price: '${isCurrentEnv ? pack.price : `price_${env.toUpperCase()}_${pack.pack.toUpperCase()}`}'
      }`).join(',\n')}
    }
  }`
    }
    
    content = `// Stripe Price and Product ID Reference
// Generated on ${new Date().toISOString()}
// This is the SINGLE SOURCE OF TRUTH for all Stripe price and product IDs

export const STRIPE_REFERENCE = {
${createEnvironmentData('test')},
  
${createEnvironmentData('production')}
}
`
  }
  
  // Write updated content back to file
  fs.writeFileSync(stripeRefPath, content)
  
  console.log(`✅ Updated stripe-reference.ts with ${envKey} Stripe price IDs`)
}

async function main() {
  try {
    console.log('🏁 Starting Stripe product setup...\n')
    
    // Check for API key
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    
    // Clean up existing products first (unless skipped)
    if (!skipCleanup) {
      await cleanupExistingProducts()
    } else {
      console.log('⏭️  Skipping cleanup - existing products will remain\n')
    }
    
    // Create subscription products
    const subscriptionResults = await createSubscriptionProducts()
    
    // Create credit pack products  
    const creditPackResults = await createCreditPackProducts()
    
    // Update pricing file with Stripe IDs
    await updatePricingFile(subscriptionResults, creditPackResults)
    
    console.log('\n🎉 Stripe setup completed successfully!')
    const envMode = process.argv.includes('--prod') ? 'production' : 'test'
    console.log('\n📋 Summary:')
    if (!skipCleanup) {
      console.log('✅ Archived existing active Primeshot products')
    }
    console.log(`✅ Created ${subscriptionResults.length} subscription tiers`)
    console.log(`✅ Created ${creditPackResults.length} credit packs`)
    console.log(`✅ Updated stripe-reference.ts with ${envMode} Stripe price IDs`)
    
    console.log('\n🔗 Next steps:')
    console.log('1. Test the checkout flows with real Stripe price IDs')
    console.log('2. Set up webhook endpoints in Stripe Dashboard')
    console.log('3. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to environment')
    console.log('4. Deploy Edge Functions with updated pricing')
    if (!skipCleanup) {
      console.log('\n💡 Tip: Use --skip-cleanup flag to keep existing products for testing')
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n👋 Setup interrupted')
  process.exit(0)
})

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main } 