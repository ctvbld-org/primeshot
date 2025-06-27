/**
 * Utility functions for generating and managing idempotency keys
 * to prevent duplicate Stripe charges and other operations
 */

import { createHash } from 'crypto';

/**
 * Generates a deterministic idempotency key based on the provided parameters.
 * This ensures the same operation with the same inputs will always generate
 * the same idempotency key.
 * 
 * @param operationType Type of operation (e.g., 'payment_intent', 'checkout_session')
 * @param orderId The order ID
 * @param userId The user ID
 * @param amount The payment amount in cents
 * @param timestamp Optional timestamp to make the key unique for retries
 * @returns A deterministic idempotency key
 */
export function generateIdempotencyKey(
  operationType: string,
  orderId: string,
  userId: string,
  amount: number,
  timestamp?: string
): string {
  // Combine all parameters into a single string
  const data = `${operationType}_${orderId}_${userId}_${amount}_${timestamp || ''}`;
  
  // Create SHA-256 hash of the data
  const hash = createHash('sha256').update(data).digest('hex');
  
  // Return a prefixed idempotency key for easier identification in logs
  return `pk_${operationType}_${hash.substring(0, 24)}`;
}

/**
 * Generates an idempotency key for a payment intent creation
 * 
 * @param orderId The order ID
 * @param userId The user ID
 * @param amount The payment amount in cents
 * @returns An idempotency key for payment intent creation
 */
export function getPaymentIntentIdempotencyKey(
  orderId: string,
  userId: string,
  amount: number
): string {
  return generateIdempotencyKey('payment_intent', orderId, userId, amount);
}

/**
 * Generates an idempotency key for a checkout session creation
 * Always includes a timestamp to ensure uniqueness for each attempt
 */
export function getCheckoutSessionIdempotencyKey(
  orderId: string,
  userId: string,
  amount: number
): string {
  // Include current timestamp to ensure uniqueness for each attempt
  const timestamp = new Date().toISOString();
  return generateIdempotencyKey('checkout_session', orderId, userId, amount, timestamp);
}

/**
 * Generates an idempotency key for updating a payment intent
 * 
 * @param paymentIntentId The payment intent ID
 * @param orderId The order ID
 * @param userId The user ID
 * @param amount The payment amount in cents
 * @returns An idempotency key for payment intent update
 */
export function getPaymentIntentUpdateIdempotencyKey(
  paymentIntentId: string,
  orderId: string,
  userId: string,
  amount: number
): string {
  return generateIdempotencyKey('payment_intent_update', `${paymentIntentId}_${orderId}`, userId, amount);
}

/**
 * Generates a unique idempotency key for retrying an operation
 * This should be used when a previous attempt has failed and needs to be retried
 * 
 * @param operationType Type of operation
 * @param orderId The order ID
 * @param userId The user ID
 * @param amount The payment amount in cents
 * @returns A unique idempotency key for retrying the operation
 */
export function getRetryIdempotencyKey(
  operationType: string,
  orderId: string,
  userId: string,
  amount: number
): string {
  // Include timestamp for retry attempts
  const timestamp = new Date().toISOString();
  return generateIdempotencyKey(operationType, orderId, userId, amount, timestamp);
} 