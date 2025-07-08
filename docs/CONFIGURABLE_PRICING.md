# Configurable Credit Pricing

This document explains how to configure credit costs without code deployment using environment variables.

## Overview

Credit costs are now configurable via environment variables, allowing you to change pricing without modifying code or redeploying the application.

## Environment Variables

**Single Source of Truth**: Set these environment variables in your Supabase project settings. Both backend and frontend use the same configuration source.

```bash
# Image generation costs
CREDIT_COST_1K=1          # Cost for 1K resolution images (default: 1)
CREDIT_COST_2K=2          # Cost for 2K resolution images (default: 2)  
CREDIT_COST_4K=3          # Cost for 4K resolution images (default: 3)

# LoRA training cost
CREDIT_COST_LORA_TRAINING=30   # Cost for LoRA training (default: 30)
```

## How to Change Pricing

### 1. Update Supabase Environment Variables

1. Go to your Supabase dashboard
2. Navigate to Settings > Edge Functions
3. Update the environment variables
4. The changes take effect immediately for new function calls

### 2. Frontend Automatically Syncs

The frontend imports pricing from the same configuration source, ensuring consistency without duplicate environment variables.

## Example: Changing 1K Image Cost from 1 to 2 Credits

Simply update the Supabase environment variable:

```bash
CREDIT_COST_1K=2
```

Both backend and frontend will use the new value.

## Verification

After updating the environment variables:

1. **Backend**: Check the Edge Function logs to see the new costs being used
2. **Frontend**: Check the pricing display in the UI to ensure it reflects the new costs
3. **Test**: Perform a test transaction to verify the correct credits are charged

## Fallback Behavior

If environment variables are not set, the system uses these default values:
- 1K images: 1 credit
- 2K images: 2 credits  
- 4K images: 3 credits
- LoRA training: 30 credits

## Files Modified

- `common/lib/pricing-config.ts` - Single source of truth for all pricing configuration
- `supabase/functions/_shared/pricing.ts` - Reads from environment variables
- `webapp/src/lib/constants/pricing.ts` - Imports from @primeshot/common/lib/pricing-config
- `webapp/src/lib/services/creditService.ts` - Uses the configurable pricing

## Benefits

✅ **Single Source of Truth**: One set of environment variables for everything  
✅ **No Duplication**: Frontend and backend use the same configuration  
✅ **Immediate Effect**: Supabase changes take effect immediately  
✅ **Version Control**: Environment variables are separate from code  
✅ **Rollback**: Easy to revert pricing changes  
✅ **Testing**: Different environments can have different pricing 