# Rewardful Integration

This document describes the Rewardful affiliate tracking integration for Primeshot.

## Overview

Rewardful is integrated to track affiliate referrals for both subscription and credit pack purchases. When a visitor arrives through an affiliate link, Rewardful captures a referral ID that is passed through the checkout process to Stripe.

## Setup

### 1. Environment Variables

Add the following environment variable to your `.env.local` files:

**webapp/.env.local:**
```bash
NEXT_PUBLIC_REWARDFUL_API_KEY=your_rewardful_api_key_here
```

**website/.env.local:**
```bash
NEXT_PUBLIC_REWARDFUL_API_KEY=your_rewardful_api_key_here
```

### 2. Getting Your Rewardful API Key

1. Log in to your Rewardful dashboard
2. Navigate to Settings > Installation
3. Copy your API key from the integration instructions

## How It Works

### 1. Script Installation

The Rewardful tracking scripts are automatically loaded in both the webapp and website layouts when the `NEXT_PUBLIC_REWARDFUL_API_KEY` environment variable is set.

**Files modified:**
- `webapp/src/app/layout.tsx`
- `website/src/app/[locale]/layout.tsx`

The scripts are loaded with the `beforeInteractive` strategy to ensure they're available before the page becomes interactive.

### 2. Referral ID Capture

The `useRewardful` hook captures the referral ID from the Rewardful tracking script:

**File:** `webapp/src/hooks/useRewardful.ts`

```typescript
const { referralId, isReady } = useRewardful()
```

This hook:
- Checks if Rewardful is loaded
- Retrieves the referral ID from `window.Rewardful.referral`
- Returns the referral ID and ready state

### 3. Checkout Integration

The referral ID is passed to Stripe in two ways:

#### a) As `client_reference_id`
This is the primary method for tracking conversions. The referral ID is set as the `client_reference_id` parameter in the Stripe checkout session.

#### b) In metadata
The referral ID is also stored in metadata for both the checkout session and the subscription/payment intent for additional tracking.

**Files modified:**
- `webapp/src/components/pricing/SubscriptionDialogContent.tsx` - Subscription purchases
- `webapp/src/components/pricing/CreditPackDialogContent.tsx` - Credit pack purchases
- `webapp/src/app/api/payment/subscription-checkout/route.ts` - Subscription checkout API
- `webapp/src/app/api/payment/credit-pack-checkout/route.ts` - Credit pack checkout API

### 4. Stripe Checkout Flow

When a checkout session is created:

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription', // or 'payment' for credit packs
  ...(referralId && { client_reference_id: referralId }),
  metadata: {
    // ... other metadata
    ...(referralId && { referral: referralId })
  },
  subscription_data: { // Only for subscriptions
    metadata: {
      // ... other metadata
      ...(referralId && { referral: referralId })
    }
  }
})
```

## Testing

### Local Testing

1. Set up your Rewardful API key in `.env.local`
2. Visit your site with a test affiliate link: `http://localhost:3000?via=test-affiliate`
3. Check browser console for the Rewardful object: `window.Rewardful`
4. Complete a purchase and verify the referral ID appears in:
   - Stripe checkout session's `client_reference_id`
   - Stripe checkout session metadata
   - Stripe subscription/payment intent metadata

### Production Testing

1. Get a test affiliate link from Rewardful dashboard
2. Visit your production site with the affiliate link
3. Complete a test purchase
4. Check Rewardful dashboard for the conversion

## Rewardful Dashboard

After successful integration, you can:

1. **View conversions**: See all tracked conversions with Stripe data
2. **Manage affiliates**: Add, edit, and view affiliate performance
3. **Configure commissions**: Set up commission structures
4. **Generate reports**: Track revenue and payouts

## Troubleshooting

### Rewardful script not loading

**Issue:** `window.Rewardful` is undefined

**Solutions:**
- Verify `NEXT_PUBLIC_REWARDFUL_API_KEY` is set correctly
- Check browser console for script loading errors
- Ensure you're not blocking third-party scripts (ad blockers)

### Referral ID not captured

**Issue:** `referralId` is null in `useRewardful` hook

**Solutions:**
- Verify you're visiting with a valid affiliate link (`?via=affiliate-code`)
- Check that Rewardful script loaded successfully
- Wait for the `rewardful('ready')` event

### Conversions not showing in Rewardful

**Issue:** Purchases complete but don't appear in Rewardful dashboard

**Solutions:**
- Verify referral ID is being passed to Stripe (check Stripe dashboard)
- Ensure Stripe webhook is configured in Rewardful settings
- Check that the `client_reference_id` matches the format expected by Rewardful

## Documentation Links

- [Rewardful Documentation](https://www.getrewardful.com/docs)
- [Rewardful + Stripe Integration](https://www.getrewardful.com/docs/integrations/stripe)
- [Stripe Checkout Sessions](https://stripe.com/docs/api/checkout/sessions)

## Support

For issues with:
- **Rewardful setup**: Contact Rewardful support
- **Integration code**: Create an issue in the project repository
- **Stripe configuration**: Check Stripe documentation or contact Stripe support

