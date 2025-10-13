/**
 * Stripe Webhook Handler
 * 
 * This endpoint handles Stripe webhook events including:
 * - customer.subscription.updated
 * - customer.subscription.deleted  
 * - payment_intent.succeeded (for paid credit pack purchases)
 * - checkout.session.completed (for all credit pack purchases, including 100% coupon)
 * 
 * Note: There are two webhook endpoints in this app:
 * - /api/payment/webhook (comprehensive handler)
 * - /api/webhooks/stripe (this handler)
 * 
 * Both endpoints handle credit pack purchases to ensure compatibility
 * with different webhook configurations across environments.
 * 
 * Important: For credit packs with 100% coupon codes, Stripe only fires
 * checkout.session.completed (not payment_intent.succeeded) since no
 * payment processing occurs. Both events are handled with idempotency
 * to prevent double-crediting.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    // Ensure webhook secret is configured
    if (!endpointSecret) {
      console.error('Missing Stripe webhook secret. Please set STRIPE_WEBHOOK_SECRET environment variable.')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Ensure service role key is configured for webhook operations
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
      console.error('No Stripe signature found in the request headers')
      return NextResponse.json(
        { error: 'Missing Stripe signature in headers' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errorMessage)
      return NextResponse.json(
        { 
          error: 'Webhook signature verification failed',
          message: errorMessage 
        },
        { status: 401 }
      )
    }

    console.log('Received Stripe webhook event:', event.type)

    // Handle different event types
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log(`[WEBHOOK DEBUG] payment_intent.succeeded received:`, {
            payment_intent_id: paymentIntent.id,
            pack_type: paymentIntent.metadata?.pack_type,
            amount: paymentIntent.amount,
            user_id: paymentIntent.metadata?.user_id,
            credits: paymentIntent.metadata?.credits
          })
          await handleCreditPackPurchase(paymentIntent)
          break
        }
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          console.log(`[WEBHOOK DEBUG] checkout.session.completed received:`, {
            session_id: session.id,
            mode: session.mode,
            pack_type: session.metadata?.pack_type,
            has_payment_intent: !!session.payment_intent,
            payment_intent_value: session.payment_intent,
            amount_total: session.amount_total,
            user_id: session.metadata?.user_id,
            credits: session.metadata?.credits
          })
          await handleCheckoutSessionCompleted(session)
          break
        }
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (eventError) {
      // Log the error but don't fail the webhook - this prevents Stripe from retrying
      const errorMessage = eventError instanceof Error ? eventError.message : 'Unknown error'
      console.error(`Error processing webhook event ${event.type}:`, errorMessage)
      
      if (eventError instanceof Error && eventError.stack) {
        console.error(eventError.stack)
      }
    }

    // Return a 200 success response to acknowledge receipt of the event
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient()
  
  console.log('Processing subscription update:', {
    id: subscription.id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: (subscription as any).current_period_end
  })

  // Update the subscription in our database
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: (subscription as any).current_period_start 
        ? new Date((subscription as any).current_period_start * 1000).toISOString()
        : null,
      current_period_end: (subscription as any).current_period_end 
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription in database:', error)
    throw error
  }

  console.log('Successfully updated subscription in database')
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient()
  
  console.log('Processing subscription deletion:', subscription.id)

  // Update the subscription status to canceled
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false, // No longer relevant since it's fully canceled
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating canceled subscription in database:', error)
    throw error
  }

  console.log('Successfully marked subscription as canceled in database')
}

/**
 * Handle checkout session completed (for 100% coupon credit packs ONLY)
 * This fires for ALL checkout completions, but we only process 100% coupon purchases here.
 * Regular paid purchases are handled by payment_intent.succeeded to avoid race conditions.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[HANDLER DEBUG] handleCheckoutSessionCompleted called for session ${session.id}`)
  
  // Only process credit pack purchases (mode: 'payment')
  if (session.mode !== 'payment' || session.metadata?.pack_type !== 'credit_pack') {
    console.log(`[HANDLER DEBUG] Skipping - mode: ${session.mode}, pack_type: ${session.metadata?.pack_type}`)
    console.log(`Skipping checkout session ${session.id} - not a credit pack purchase`)
    return
  }

  // Skip if payment_intent exists - let payment_intent.succeeded handle regular payments
  // This event should ONLY process 100% coupon purchases (no payment_intent)
  if (session.payment_intent) {
    console.log(`[HANDLER DEBUG] Skipping - has payment_intent: ${typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id}`)
    console.log(`Skipping checkout session ${session.id} - has payment_intent, will be handled by payment_intent.succeeded`)
    return
  }
  
  console.log(`[HANDLER DEBUG] Processing 100% coupon purchase`)

  const userId = session.metadata?.user_id
  const credits = parseInt(session.metadata?.credits || '0')
  const validityDays = parseInt(session.metadata?.validity_days || '60')

  if (!userId || !credits) {
    console.error('Missing user_id or credits in checkout session metadata', session.id)
    return
  }

  // For 100% coupon purchases, use session ID as the unique identifier
  const sourceId = session.id

  // Amount is 0 for 100% coupon
  const amountPaid = session.amount_total || 0

  console.log(`Processing 100% coupon checkout session for credit pack: ${credits} credits for user ${userId}`)

  // Calculate expiry date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + validityDays)

  const description = `Credits from credit pack purchase (100% coupon) - ${credits} credits`
  const metadata = {
    checkout_session_id: session.id,
    amount_paid: amountPaid,
    validity_days: validityDays,
    coupon_applied: true,
    payment_method: '100% coupon'
  }

  // Use service role client for webhook operations
  const supabase = createServiceClient()

  console.log(`[RPC DEBUG] About to call process_credit_pack_purchase (100% coupon) with:`, {
    p_user_id: userId,
    p_payment_intent_id: sourceId,
    p_credits: credits,
    p_amount_paid: amountPaid,
    p_expires_at: expiresAt.toISOString()
  })

  // Use atomic RPC function to record purchase and award credits
  let atomicError
  try {
    const result = await supabase.rpc('process_credit_pack_purchase', {
      p_user_id: userId,
      p_payment_intent_id: sourceId,
      p_price_id: session.metadata?.price_id || '',
      p_credits: credits,
      p_amount_paid: amountPaid,
      p_expires_at: expiresAt.toISOString(),
      p_description: description,
      p_metadata: metadata
    })
    atomicError = result.error
    console.log(`[RPC DEBUG] RPC call completed (100% coupon). Error:`, atomicError, 'Result:', result)
  } catch (rpcException) {
    console.error('[RPC DEBUG] RPC call threw exception (100% coupon):', rpcException)
    throw rpcException
  }

  if (atomicError) {
    console.error('Error in atomic credit pack purchase operation (100% coupon):', atomicError)
    console.error('Full error details:', JSON.stringify(atomicError, null, 2))
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`)
  }

  console.log(`[SUCCESS] Successfully processed 100% coupon credit pack: ${credits} credits awarded to user ${userId}`)
}

/**
 * Handle credit pack purchase (payment_intent.succeeded)
 * This fires for regular PAID purchases. For 100% coupon purchases, only checkout.session.completed fires.
 */
async function handleCreditPackPurchase(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[HANDLER DEBUG] handleCreditPackPurchase called for payment_intent ${paymentIntent.id}`)
  
  // Check if this is a credit pack purchase
  if (paymentIntent.metadata?.pack_type !== 'credit_pack') {
    console.log(`[HANDLER DEBUG] Skipping - pack_type: ${paymentIntent.metadata?.pack_type}`)
    console.log(`Skipping payment intent ${paymentIntent.id} - not a credit pack purchase`)
    return
  }
  
  console.log(`[HANDLER DEBUG] Processing paid credit pack purchase`)

  const userId = paymentIntent.metadata?.user_id
  const credits = parseInt(paymentIntent.metadata?.credits || '0')
  const validityDays = parseInt(paymentIntent.metadata?.validity_days || '60')

  if (!userId || !credits) {
    console.error('Missing user_id or credits in payment intent metadata', paymentIntent.id)
    return
  }

  console.log(`Processing paid credit pack purchase: ${credits} credits for user ${userId}, amount: $${paymentIntent.amount / 100}`)

  // Calculate expiry date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + validityDays)

  const description = `Credits from credit pack purchase - ${credits} credits`
  const metadata = {
    payment_intent_id: paymentIntent.id,
    amount_paid: paymentIntent.amount,
    validity_days: validityDays,
    coupon_applied: false,
    payment_method: 'card'
  }

  // Use service role client for webhook operations
  const supabase = createServiceClient()

  console.log(`[RPC DEBUG] About to call process_credit_pack_purchase with:`, {
    p_user_id: userId,
    p_payment_intent_id: paymentIntent.id,
    p_credits: credits,
    p_amount_paid: paymentIntent.amount,
    p_expires_at: expiresAt.toISOString()
  })

  // Use atomic RPC function to record purchase and award credits
  let atomicError
  try {
    const result = await supabase.rpc('process_credit_pack_purchase', {
      p_user_id: userId,
      p_payment_intent_id: paymentIntent.id,
      p_price_id: paymentIntent.metadata?.price_id || '',
      p_credits: credits,
      p_amount_paid: paymentIntent.amount,
      p_expires_at: expiresAt.toISOString(),
      p_description: description,
      p_metadata: metadata
    })
    atomicError = result.error
    console.log(`[RPC DEBUG] RPC call completed. Error:`, atomicError, 'Result:', result)
  } catch (rpcException) {
    console.error('[RPC DEBUG] RPC call threw exception:', rpcException)
    throw rpcException
  }

  if (atomicError) {
    console.error('Error in atomic credit pack purchase operation (paid):', atomicError)
    console.error('Full error details:', JSON.stringify(atomicError, null, 2))
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`)
  }

  console.log(`[SUCCESS] Successfully processed paid credit pack purchase: ${credits} credits awarded to user ${userId}`)
}
