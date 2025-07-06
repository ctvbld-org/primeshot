#!/usr/bin/env node

/**
 * Script to programmatically create Stripe products and prices
 * Run with: node scripts/setup-stripe-products.js
 * 
 * Requires STRIPE_SECRET_KEY environment variable
 */

import Stripe from 'stripe'
import { SUBSCRIPTION_TIERS_CONFIG, CREDIT_PACKS_CONFIG } from './pricing-config.js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
})

// Convert pricing.ts data to Stripe-compatible format
function convertTierForStripe(tier) {
  return {
    id: tier.id,
    name: tier.name,
    description: tier.description,
    monthlyPrice: tier.monthlyPrice,
    yearlyPrice: tier.yearlyPrice ? Math.round(tier.yearlyPrice / 12) : null,
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
        const yearlyTotal = tierData.yearlyPrice
        console.log(`Creating yearly price: $${yearlyTotal}`)
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
        name: `${pack.credits} Credits - ${pack.name}`,
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
  console.log('📝 Updating pricing.ts with Stripe price IDs...\n')
  
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  const pricingPath = path.join(__dirname, '../webapp/src/lib/constants/pricing.ts')
  let content = fs.readFileSync(pricingPath, 'utf8')
  
  // Update subscription price IDs
  for (const result of subscriptionResults) {
    // Replace monthly price ID
    const monthlyPattern = new RegExp(
      `(id: '${result.tier}'[\\s\\S]*?stripePriceIds: {[\\s\\S]*?monthly: ')([^']*)'`,
      'g'
    )
    content = content.replace(monthlyPattern, `$1${result.monthlyPrice}'`)
    
    // Replace yearly price ID (if available)
    if (result.yearlyPrice) {
      const yearlyPattern = new RegExp(
        `(id: '${result.tier}'[\\s\\S]*?stripePriceIds: {[\\s\\S]*?yearly: ')([^']*)'`,
        'g'
      )
      content = content.replace(yearlyPattern, `$1${result.yearlyPrice}'`)
    }
  }
  
  // Update credit pack price IDs
  for (const result of creditPackResults) {
    const packPattern = new RegExp(
      `(id: '${result.pack}'[\\s\\S]*?stripePriceId: ')([^']*)'`,
      'g'
    )
    content = content.replace(packPattern, `$1${result.price}'`)
  }
  
  // Write updated content back to file
  fs.writeFileSync(pricingPath, content)
  
  console.log(`✅ Updated pricing.ts with Stripe price IDs`)
  
  // Also create a backup reference file
  const backupContent = `// Stripe Price and Product ID Reference
// Generated on ${new Date().toISOString()}
// This is a backup reference file - actual IDs are in pricing.ts

export const STRIPE_REFERENCE = {
  subscriptions: {
${subscriptionResults.map(tier => `    ${tier.tier}: {
      product: '${tier.product}',
      monthly: '${tier.monthlyPrice}'${tier.yearlyPrice ? `,\n      yearly: '${tier.yearlyPrice}'` : ''}
    }`).join(',\n')}
  },
  
  creditPacks: {
${creditPackResults.map(pack => `    ${pack.pack}: {
      product: '${pack.product}',
      price: '${pack.price}'
    }`).join(',\n')}
  }
}
`
  
  const backupPath = path.join(__dirname, '../webapp/src/lib/constants/stripe-reference.ts')
  fs.writeFileSync(backupPath, backupContent)
  
  console.log(`✅ Created backup reference file: stripe-reference.ts`)
}

async function main() {
  try {
    console.log('🏁 Starting Stripe product setup...\n')
    
    // Check for API key
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    
    // Create subscription products
    const subscriptionResults = await createSubscriptionProducts()
    
    // Create credit pack products  
    const creditPackResults = await createCreditPackProducts()
    
    // Update pricing file with Stripe IDs
    await updatePricingFile(subscriptionResults, creditPackResults)
    
    console.log('\n🎉 Stripe setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`✅ Created ${subscriptionResults.length} subscription tiers`)
    console.log(`✅ Created ${creditPackResults.length} credit packs`)
    console.log('✅ Updated pricing.ts with Stripe price IDs')
    console.log('✅ Created backup reference file')
    
    console.log('\n🔗 Next steps:')
    console.log('1. Test the checkout flows with real Stripe price IDs')
    console.log('2. Set up webhook endpoints in Stripe Dashboard')
    console.log('3. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to environment')
    console.log('4. Deploy Edge Functions with updated pricing')
    
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