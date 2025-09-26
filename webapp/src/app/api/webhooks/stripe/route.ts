/**
 * Stripe Webhook Handler
 * 
 * This endpoint handles Stripe webhook events including:
 * - customer.subscription.updated
 * - customer.subscription.deleted  
 * - payment_intent.succeeded (for credit pack purchases)
 * 
 * Note: There are two webhook endpoints in this app:
 * - /api/payment/webhook (comprehensive handler)
 * - /api/webhooks/stripe (this handler - now includes credit packs)
 * 
 * Both endpoints handle credit pack purchases to ensure compatibility
 * with different webhook configurations across environments.
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
        case 'payment_intent.succeeded':
          await handleCreditPackPurchase(event.data.object as Stripe.PaymentIntent)
          break
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
 * Handle credit pack purchase (payment_intent.succeeded)
 */
async function handleCreditPackPurchase(paymentIntent: Stripe.PaymentIntent) {
  // Check if this is a credit pack purchase
  if (paymentIntent.metadata?.pack_type !== 'credit_pack') {
    console.log(`Skipping payment intent ${paymentIntent.id} - not a credit pack purchase`)
    return
  }

  const userId = paymentIntent.metadata?.user_id
  const credits = parseInt(paymentIntent.metadata?.credits || '0')
  const validityDays = parseInt(paymentIntent.metadata?.validity_days || '60')

  if (!userId || !credits) {
    console.error('Missing user_id or credits in payment intent metadata', paymentIntent.id)
    return
  }

  console.log(`Processing credit pack purchase: ${credits} credits for user ${userId}`)

  // Calculate expiry date (60 days from purchase)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + validityDays)

  const description = `Credits from credit pack purchase - ${credits} credits`
  const metadata = {
    payment_intent_id: paymentIntent.id,
    amount_paid: paymentIntent.amount,
    validity_days: validityDays
  }

  // Use service role client for webhook operations
  const supabase = createServiceClient()

  // Use atomic RPC function to record purchase and award credits
  const { error: atomicError } = await supabase.rpc('process_credit_pack_purchase', {
    p_user_id: userId,
    p_payment_intent_id: paymentIntent.id,
    p_price_id: paymentIntent.metadata?.price_id || '',
    p_credits: credits,
    p_amount_paid: paymentIntent.amount,
    p_expires_at: expiresAt.toISOString(),
    p_description: description,
    p_metadata: metadata
  })

  if (atomicError) {
    console.error('Error in atomic credit pack purchase operation:', atomicError.message)
    throw new Error(`Failed to process credit pack purchase atomically: ${atomicError.message}`)
  }

  console.log(`Successfully processed credit pack purchase: ${credits} credits awarded to user ${userId}`)
}
