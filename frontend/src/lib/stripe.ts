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
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // Handle non-JSON responses gracefully
        console.warn('Failed to parse error response as JSON:', jsonError);
        try {
          // Try to get text content as fallback
          errorMessage = await response.text() || errorMessage;
        } catch (textError) {
          console.warn('Failed to parse error response as text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    // Parse successful response safely
    let sessionData;
    try {
      sessionData = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse successful response as JSON:', jsonError);
      throw new Error('Invalid response format from server');
    }

    const { sessionId, idempotencyKey } = sessionData;
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
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // Handle non-JSON responses gracefully
        console.warn('Failed to parse error response as JSON:', jsonError);
        try {
          // Try to get text content as fallback
          errorMessage = await response.text() || errorMessage;
        } catch (textError) {
          console.warn('Failed to parse error response as text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    // Parse successful response safely
    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse successful response as JSON:', jsonError);
      throw new Error('Invalid response format from server');
    }

    const { clientSecret, idempotencyKey, paymentIntentId } = responseData;
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