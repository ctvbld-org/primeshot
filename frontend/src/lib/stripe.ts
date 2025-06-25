import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe public key
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  console.error('CRITICAL ERROR: Stripe publishable key is missing. Payment functionality will fail.');
  throw new Error('Missing required environment variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
}

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance for the frontend
 */
export const getStripe = () => {
  if (!stripePromise) {
    // The key check at the top of the file will throw if missing,
    // but this is an additional safeguard to prevent null returns
    if (!stripePublicKey) {
      throw new Error('Stripe publishable key is missing. Payment functionality will fail.');
    }
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
  customerEmail?: string;
  customerName?: string;
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
      credentials: 'include',
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
    
    // Only retry on network errors or server errors (5xx)
    // Don't retry on client errors (4xx) as they won't be resolved by retrying
    const shouldRetry = 
      // Handle non-Error objects (like DOMExceptions)
      !(error instanceof Error) ||
      // For Error objects, check message content
      (error instanceof Error && 
       !error.message.includes('status 4') && 
       !error.message.match(/40[0-9]/) && 
       // Check for common network error messages or server errors
       (error.message.includes('network') || 
        error.message.includes('timeout') || 
        error.message.includes('connection') ||
        error.message.includes('status 5') || 
        error.message.match(/50[0-9]/)
       )
      );
    
    if (shouldRetry) {
      // Retry with incremented retry attempt
      return createCheckoutSession({
        ...data,
        retryAttempt: (data.retryAttempt || 0) + 1
      });
    } else {
      // Don't retry client errors
      throw error;
    }
  }
}