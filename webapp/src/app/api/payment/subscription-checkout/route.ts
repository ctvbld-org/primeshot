import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

async function handlePOST(request: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl, referralId } = await request.json()

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, successUrl, cancelUrl' },
        { status: 400 }
      )
    }

    // Get user from auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate the price ID exists and is a subscription
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    })

    if (!price.active || price.type !== 'recurring') {
      return NextResponse.json(
        { error: 'Invalid subscription price ID' },
        { status: 400 }
      )
    }

    const product = price.product as Stripe.Product

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, status, cancel_at_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    // Determine if this is truly an upgrade (active subscription not scheduled for cancellation)
    // vs a new subscription (no active subscription, or subscription scheduled for cancellation)
    const isActiveUpgrade = existingSubscription?.stripe_subscription_id && 
                           existingSubscription.status === 'active' && 
                           !existingSubscription.cancel_at_period_end

    let customerId: string

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      
      // If user has an active subscription that's not scheduled for cancellation, this is an upgrade
      if (isActiveUpgrade) {
        try {
          // Get customer's payment methods to check if we can charge directly
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
          })

          // If customer has a payment method, create subscription directly without checkout
          if (paymentMethods.data.length > 0) {
            // Cancel the current subscription immediately (no proration)
            await stripe.subscriptions.cancel(existingSubscription.stripe_subscription_id)
            console.log(`Canceled existing subscription: ${existingSubscription.stripe_subscription_id}`)

            // Create new subscription directly using existing payment method
            const newSubscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: priceId }],
              default_payment_method: paymentMethods.data[0].id,
              metadata: {
                user_id: user.id,
                user_email: user.email || '',
                plan_name: product.metadata.plan_name || '',
                credits_included: product.metadata.credits_included || '0',
                source: 'webapp_upgrade',
                is_upgrade: 'true',
                is_new_subscription: 'false',
                ...(referralId && { referral: referralId })
              }
            })

            console.log(`Created new subscription directly: ${newSubscription.id}`)
            
            return NextResponse.json({
              success: true,
              subscription_id: newSubscription.id,
              redirect_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}subscription=success&upgrade=true`
            })
          }
          
          // If no payment method, proceed to checkout WITHOUT canceling current subscription
          // This is safer - the webhook will handle canceling the old subscription after successful payment
          // This prevents users from being left without a subscription if they abandon checkout
          console.log(`No payment method found for customer ${customerId} - proceeding to checkout. Current subscription ${existingSubscription.stripe_subscription_id} will be canceled after successful payment.`)
          
        } catch (error) {
          console.error('Error handling subscription upgrade:', error)
          return NextResponse.json(
            { error: 'Failed to process subscription upgrade' },
            { status: 500 }
          )
        }
      }
    } else {
      // Create new customer if none exists
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      ...(referralId && { client_reference_id: referralId }),
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        plan_name: product.metadata.plan_name || '',
        credits_included: product.metadata.credits_included || '0',
        checkout_type: 'subscription',
        created_at: new Date().toISOString(),
        is_upgrade: isActiveUpgrade ? 'true' : 'false',
        is_new_subscription: !isActiveUpgrade ? 'true' : 'false',
        previous_subscription_id: existingSubscription?.stripe_subscription_id || '',
        ...(referralId && { referral: referralId })
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email || '',
          plan_name: product.metadata.plan_name || '',
          credits_included: product.metadata.credits_included || '0',
          created_at: new Date().toISOString(),
          source: isActiveUpgrade ? 'webapp_upgrade' : 'webapp_checkout',
          is_upgrade: isActiveUpgrade ? 'true' : 'false',
          is_new_subscription: !isActiveUpgrade ? 'true' : 'false',
          previous_subscription_id: existingSubscription?.stripe_subscription_id || '',
          ...(referralId && { referral: referralId })
        }
      },
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}subscription=success&upgrade=${isActiveUpgrade ? 'true' : 'false'}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    console.error('Error creating subscription checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

// Secured handler with authentication and rate limiting
const securedPOST = createSecuredHandler(
  handlePOST,
  SECURITY_PRESETS.PAYMENT_OPERATION
);

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}