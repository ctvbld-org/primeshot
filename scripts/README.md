# Stripe Product Setup Script

This script programmatically creates all Stripe products and prices for your subscription tiers and credit packs by importing the shared configuration from `pricing-config.js`, then updates your pricing configuration with the actual Stripe price IDs.

## Single Source of Truth

To avoid duplication, pricing configuration is centralized in `scripts/pricing-config.js`:
- ✅ **DRY Principle**: No duplicate configuration
- ✅ **Consistency**: Same data used by both TypeScript and Node.js
- ✅ **Easy Updates**: Edit once in `pricing-config.js`
- ✅ **Type Safety**: TypeScript interfaces applied in `pricing.ts`

## Setup

1. **Install dependencies** (already done):
   ```bash
   cd scripts
   npm install
   ```

2. **Set your Stripe secret key**:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...  # For testing
   # or
   export STRIPE_SECRET_KEY=sk_live_...  # For production
   ```

## Usage

Run the script from the project root:

```bash
# Make sure you're in the project root
cd /path/to/Primeshot/App

# Set your Stripe key
export STRIPE_SECRET_KEY=your_stripe_secret_key

# Run the setup script
node scripts/setup-stripe-products.js
```

## What it does

### 1. Creates Subscription Products in Stripe

**Tier 1 - Starter** ($39/month, $252/year)
- 300 credits per month
- 1K resolution max
- 1 LoRA training included
- 1 concurrent job, 3 max LoRAs

**Tier 2 - Professional** ($59/month, $384/year)  
- 600 credits per month
- 2K resolution max
- 3 LoRA training included  
- 2 concurrent jobs, 10 max LoRAs

**Tier 3 - Enterprise** ($99/month, $648/year)
- 1200 credits per month
- 4K resolution max
- 10 LoRA training included
- 5 concurrent jobs, 50 max LoRAs

### 2. Creates Credit Pack Products

- **Starter Pack**: 100 credits for $15 (90-day validity)
- **Popular Pack**: 300 credits for $39 (120-day validity)  
- **Pro Pack**: 600 credits for $69 (180-day validity)

### 3. Updates Your Code

- Updates `webapp/src/lib/constants/pricing.ts` with actual Stripe price IDs
- Creates `webapp/src/lib/constants/stripe-reference.ts` as a backup reference

## Script Output

The script will show progress as it creates each product and price:

```
🚀 Creating subscription products...

Creating product: Starter
Creating monthly price: $39
Creating yearly price: $252
✅ Starter created successfully

📝 Updating pricing.ts with Stripe price IDs...
✅ Updated pricing.ts with Stripe price IDs
✅ Created backup reference file

🎉 Stripe setup completed successfully!
```

## Important Notes

1. **Run once per environment** - This creates new products each time you run it
2. **Test vs Production** - Use test keys for development, live keys for production
3. **Backup** - The script creates a backup reference file with all IDs
4. **Metadata** - All products include comprehensive metadata for your application to use

## Troubleshooting

- **"API key not found"**: Make sure you've set `STRIPE_SECRET_KEY`
- **Permission denied**: Ensure your API key has permission to create products/prices
- **Already exists**: If products already exist, you may need to delete them first in Stripe Dashboard

## Next Steps After Running

1. **Test checkout flows** with the real Stripe price IDs
2. **Set up webhook endpoints** in Stripe Dashboard
3. **Add environment variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
4. **Deploy Edge Functions** with the updated pricing configuration

## Product Metadata

Each product includes metadata that your application uses:

```javascript
// Subscription metadata
{
  plan_name: 'tier_1',
  credits_included: '300',
  max_resolution: '1K',
  lora_training_included: '1',
  concurrent_jobs: '1',
  max_loras: '3',
  tier_type: 'subscription'
}

// Credit pack metadata  
{
  credits: '100',
  validity_days: '90',
  pack_id: 'credits_100',
  tier_type: 'credit_pack'
}
```

This metadata is used by your `CreditService` to enforce limits and calculate costs. 