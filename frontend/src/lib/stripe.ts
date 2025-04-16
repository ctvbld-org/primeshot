import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe public key
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  console.error('Stripe publishable key is missing');
}

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance for the frontend
 */
export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

/**
 * Create a Stripe checkout session
 * @param data Checkout session data
 * @returns Checkout session info
 */
export async function createCheckoutSession(data: {
  orderId: string;
  amount: number;
  metadata?: Record<string, string>;
  retryAttempt?: number;
}): Promise<{
  sessionId: string;
  idempotencyKey: string;
}> {
  try {
    const response = await fetch('/api/payment/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        retryAttempt: data.retryAttempt || 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { sessionId, idempotencyKey } = await response.json();
    return { sessionId, idempotencyKey };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    
    // If this was already a retry attempt, don't retry again
    if (data.retryAttempt && data.retryAttempt > 2) {
      throw error;
    }
    
    // Retry with incremented retry attempt
    return createCheckoutSession({
      ...data,
      retryAttempt: (data.retryAttempt || 0) + 1
    });
  }
}

/**
 * Create a Stripe payment intent
 * @param data Payment intent data
 * @returns Payment intent info
 */
export async function createPaymentIntent(data: {
  orderId: string;
  amount: number;
  metadata?: Record<string, string>;
  retryAttempt?: number;
}): Promise<{
  clientSecret: string;
  idempotencyKey: string;
  paymentIntentId: string;
}> {
  try {
    const response = await fetch('/api/payment/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        retryAttempt: data.retryAttempt || 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    const { clientSecret, idempotencyKey, paymentIntentId } = await response.json();
    return { clientSecret, idempotencyKey, paymentIntentId };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    
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