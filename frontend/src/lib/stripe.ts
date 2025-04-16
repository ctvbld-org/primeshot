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
 * @returns Checkout session ID
 */
export async function createCheckoutSession(data: {
  orderId: string;
  amount: number;
  metadata?: Record<string, string>;
}) {
  const response = await fetch('/api/payment/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const { sessionId } = await response.json();
  return sessionId;
}

/**
 * Create a Stripe payment intent
 * @param data Payment intent data
 * @returns Payment intent client secret
 */
export async function createPaymentIntent(data: {
  orderId: string;
  amount: number;
  metadata?: Record<string, string>;
}) {
  const response = await fetch('/api/payment/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const { clientSecret } = await response.json();
  return clientSecret;
} 