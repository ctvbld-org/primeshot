# Rewardful Integration Implementation Summary

## Overview

Rewardful affiliate tracking has been successfully integrated into both the Primeshot webapp and website. This allows tracking of referrals and conversions for both subscription purchases and credit pack purchases.

## What Was Implemented

### 1. Script Installation

**Files Modified:**
- `webapp/src/app/layout.tsx`
- `website/src/app/[locale]/layout.tsx`

**Changes:**
- Added Next.js `Script` component import
- Added Rewardful tracking scripts with `beforeInteractive` strategy
- Scripts only load when `NEXT_PUBLIC_REWARDFUL_API_KEY` environment variable is set
- Two scripts are loaded:
  1. Main Rewardful script: `https://r.wdfl.co/rw.js`
  2. Queue initialization script for the `rewardful()` function

### 2. Referral ID Capture Hook

**New File Created:**
- `webapp/src/hooks/useRewardful.ts`

**Functionality:**
- Custom React hook to capture the Rewardful referral ID
- Returns `{ referralId, isReady }` state
- Handles the Rewardful 'ready' event
- Fallback checking mechanism with timeout

### 3. Frontend Integration

**Files Modified:**
- `webapp/src/components/pricing/SubscriptionDialogContent.tsx`
- `webapp/src/components/pricing/CreditPackDialogContent.tsx`

**Changes:**
- Imported `useRewardful` hook
- Captured referral ID in component state
- Passed referral ID to checkout API endpoints

### 4. Backend API Integration

**Files Modified:**
- `webapp/src/app/api/payment/subscription-checkout/route.ts`
- `webapp/src/app/api/payment/credit-pack-checkout/route.ts`

**Changes:**
- Accept `referralId` parameter from request body
- Pass referral ID to Stripe in two places:
  1. **`client_reference_id`**: Primary tracking method for Rewardful
  2. **`metadata.referral`**: Backup tracking in metadata

### 5. Documentation

**New Files Created:**
- `docs/rewardful-integration.md` - Comprehensive integration guide
- `REWARDFUL_IMPLEMENTATION.md` - This summary document

## Environment Variables Required

Add to both `webapp/.env.local` and `website/.env.local`:

```bash
NEXT_PUBLIC_REWARDFUL_API_KEY=your_rewardful_api_key_here
```

> **Note:** This is a public key (prefixed with `NEXT_PUBLIC_`) because it needs to be accessible in the browser for the Rewardful tracking script.

## How It Works (Flow)

1. **Visitor arrives via affiliate link** (e.g., `https://primeshot.ai?via=affiliate-code`)
2. **Rewardful script loads** and stores referral ID in cookie and `window.Rewardful.referral`
3. **useRewardful hook** captures the referral ID when component mounts
4. **User proceeds to checkout** (subscription or credit pack)
5. **Referral ID is sent** with the checkout request to the API
6. **API creates Stripe session** with referral ID as:
   - `client_reference_id` - Used by Rewardful to track conversion
   - `metadata.referral` - Stored for reference
7. **User completes payment** in Stripe
8. **Stripe webhook fires** to Rewardful with `client_reference_id`
9. **Rewardful tracks conversion** and attributes it to the affiliate

## Testing Checklist

### Local Development

- [ ] Set `NEXT_PUBLIC_REWARDFUL_API_KEY` in environment files
- [ ] Restart development servers
- [ ] Visit site with test affiliate link: `http://localhost:3000?via=test`
- [ ] Open browser console and verify `window.Rewardful` exists
- [ ] Check that `window.Rewardful.referral` contains a UUID
- [ ] Test subscription purchase flow
- [ ] Test credit pack purchase flow
- [ ] Verify referral ID in Stripe dashboard (checkout session)

### Production

- [ ] Deploy to staging/production with environment variable set
- [ ] Get real affiliate link from Rewardful dashboard
- [ ] Test complete purchase flow
- [ ] Verify conversion appears in Rewardful dashboard
- [ ] Check Stripe webhook logs for successful events

## Stripe Integration Details

The referral ID is passed to Stripe in multiple locations to ensure tracking:

### Subscription Checkout

```typescript
stripe.checkout.sessions.create({
  client_reference_id: referralId,           // ← Primary tracking
  metadata: {
    referral: referralId                     // ← Backup in session metadata
  },
  subscription_data: {
    metadata: {
      referral: referralId                   // ← Stored on subscription
    }
  }
})
```

### Credit Pack Checkout

```typescript
stripe.checkout.sessions.create({
  client_reference_id: referralId,           // ← Primary tracking
  metadata: {
    referral: referralId                     // ← Backup in session metadata
  },
  payment_intent_data: {
    metadata: {
      referral: referralId                   // ← Stored on payment intent
    }
  }
})
```

## Rewardful Dashboard Configuration

After deployment, configure Rewardful:

1. **Stripe Connection**: Connect your Stripe account in Rewardful settings
2. **Webhook Setup**: Rewardful will listen to Stripe webhooks automatically
3. **Commission Rules**: Set up commission structures for affiliates
4. **Affiliate Invites**: Invite affiliates or allow self-registration

## Key Benefits

✅ **Automatic Tracking**: No manual conversion tracking needed  
✅ **Stripe Native**: Uses Stripe's built-in referral tracking  
✅ **Multiple Touchpoints**: Referral ID stored in multiple places  
✅ **Non-Blocking**: Scripts load asynchronously  
✅ **Conditional Loading**: Only loads when API key is present  
✅ **Type-Safe**: Full TypeScript support in frontend code  

## Files Changed Summary

### New Files (2)
1. `webapp/src/hooks/useRewardful.ts` - Referral capture hook
2. `docs/rewardful-integration.md` - Integration documentation

### Modified Files (6)
1. `webapp/src/app/layout.tsx` - Added Rewardful scripts
2. `website/src/app/[locale]/layout.tsx` - Added Rewardful scripts
3. `webapp/src/components/pricing/SubscriptionDialogContent.tsx` - Capture & send referral
4. `webapp/src/components/pricing/CreditPackDialogContent.tsx` - Capture & send referral
5. `webapp/src/app/api/payment/subscription-checkout/route.ts` - Accept & pass referral to Stripe
6. `webapp/src/app/api/payment/credit-pack-checkout/route.ts` - Accept & pass referral to Stripe

## Next Steps

1. **Get API Key**: Obtain your Rewardful API key from the dashboard
2. **Set Environment Variable**: Add to both webapp and website `.env.local`
3. **Deploy**: Push changes to staging/production
4. **Configure Rewardful**: Complete setup in Rewardful dashboard
5. **Test**: Run through complete purchase flow with test affiliate link
6. **Invite Affiliates**: Start your affiliate program!

## Support & Resources

- **Rewardful Docs**: https://www.getrewardful.com/docs
- **Stripe Integration**: https://www.getrewardful.com/docs/integrations/stripe
- **Project Docs**: See `docs/rewardful-integration.md` for detailed guide

---

**Implementation Date**: October 15, 2025  
**Status**: ✅ Complete and Ready for Testing

