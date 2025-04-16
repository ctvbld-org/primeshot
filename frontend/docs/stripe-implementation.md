# Stripe Implementation with Idempotency Keys

## Overview

Our payment system uses Stripe for processing payments, with robust idempotency handling to prevent duplicate charges and ensure transaction reliability. This document explains how idempotency keys are implemented in our Stripe operations.

## What are Idempotency Keys?

Idempotency keys ensure that an API request can be retried multiple times without performing the same operation twice. If a request fails due to a network issue or timeout, the same operation can be safely retried with the same idempotency key, and Stripe will return the result of the original request instead of creating a duplicate.

## Implementation Details

### 1. Idempotency Key Generation

We use cryptographically secure, deterministic idempotency keys based on the following parameters:
- Operation type (payment_intent, checkout_session)
- Order ID
- User ID
- Payment amount
- Optional timestamp (for retries)

The generation logic is in `src/lib/server/idempotency.ts`:

```typescript
// Generate a deterministic idempotency key
export function generateIdempotencyKey(
  operationType: string,
  orderId: string,
  userId: string,
  amount: number,
  timestamp?: string
): string {
  const data = `${operationType}_${orderId}_${userId}_${amount}_${timestamp || ''}`;
  const hash = createHash('sha256').update(data).digest('hex');
  return `pk_${operationType}_${hash.substring(0, 24)}`;
}
```

### 2. Database Storage

Idempotency keys are stored in the database for audit and debugging purposes:

```sql
-- Database schema
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
```

### 3. API Implementation

#### Payment Intent Creation

Payment intents include idempotency keys when created or updated:

```typescript
// Create a payment intent with idempotency key
paymentIntent = await stripe.paymentIntents.create(
  {
    amount: verifiedAmount,
    currency: 'usd',
    metadata: { /* ... */ },
  },
  {
    idempotencyKey: baseIdempotencyKey
  }
);
```

#### Checkout Session Creation

Checkout sessions use similar idempotency key implementation:

```typescript
// Create checkout session with idempotency key
const checkoutSession = await stripe.checkout.sessions.create(
  {
    payment_method_types: ['card'],
    /* Other parameters */
  },
  {
    idempotencyKey
  }
);
```

### 4. Client-Side Retry Logic

Frontend API clients automatically retry failed requests with incremented retry attempts:

```typescript
export async function createPaymentIntent(data: {
  // Parameters
}): Promise<{
  clientSecret: string;
  idempotencyKey: string;
  paymentIntentId: string;
}> {
  try {
    // Make API request
  } catch (error) {
    // If this was already a retry attempt, don't retry again
    if (data.retryAttempt && data.retryAttempt > 2) {
      throw error;
    }
    
    // Retry with incremented retry attempt
    return createPaymentIntent({
      ...data,
      retryAttempt: (data.retryAttempt || 0) + 1
    });
  }
}
```

## Types of Idempotency Keys

1. **Payment Intent Creation**
   - Format: `pk_payment_intent_[hash]`
   - Used when creating new payment intents

2. **Payment Intent Update**
   - Format: `pk_payment_intent_update_[hash]`
   - Used when updating existing payment intents

3. **Checkout Session Creation**
   - Format: `pk_checkout_session_[hash]`
   - Used when creating checkout sessions

4. **Retry Keys**
   - Format: `pk_[operation]_[hash]_[timestamp]`
   - Used for retry attempts after a failure
   - Includes a timestamp to make it unique

## Benefits

1. **Prevent Duplicate Charges**
   - If a request is retried due to a network issue, the customer will not be charged twice

2. **Improved Transaction Reliability**
   - Automatic retry mechanism with proper idempotency handling

3. **Better Debugging**
   - Idempotency keys are stored in the database and included in logs
   - Can trace operations across retries

4. **Consistent Payment Records**
   - Even if a payment request is retried, it will update the same record

## Testing Idempotency

To test the idempotency implementation:

1. Create a payment with a specific idempotency key
2. Attempt to create another payment with the same key
3. Verify that no duplicate payment is created

Example test:
```typescript
// Create first payment
const result1 = await createPaymentIntent({ orderId, amount });

// Try to create second payment with same key
const result2 = await fetch('/api/payment/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId,
    amount,
    // Use the same idempotency key
    customIdempotencyKey: result1.idempotencyKey
  })
});

// Verify both have the same payment intent ID
expect(result1.paymentIntentId).toEqual(result2.paymentIntentId);
```

## Security Considerations

- Idempotency keys contain no sensitive information
- Cryptographically secure hashing prevents manipulation
- Keys are stored securely in the database

## Relevant Files

- `src/lib/server/idempotency.ts` - Key generation utilities
- `src/app/api/payment/create-payment-intent/route.ts` - Payment intent API
- `src/app/api/payment/create-checkout-session/route.ts` - Checkout session API
- `src/lib/stripe.ts` - Client-side payment utilities
- `supabase/migrations/20250615000000_add_idempotency_keys.sql` - Database schema 