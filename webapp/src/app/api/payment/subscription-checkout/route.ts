import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, successUrl, cancelUrl } = await request.json()

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
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    let customerId: string

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      
      // If user has an active subscription, upgrade it instead of creating a new one
      if (existingSubscription.stripe_subscription_id) {
        try {
          // Get the current subscription from Stripe
          const currentSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)
          
          // Modify the existing subscription with prorated billing
          const updatedSubscription = await stripe.subscriptions.update(existingSubscription.stripe_subscription_id, {
            items: [{
              id: currentSubscription.items.data[0].id,
              price: priceId,
            }],
            proration_behavior: 'always_invoice', // Prorate immediately
            metadata: {
              user_id: user.id,
              user_email: user.email || '',
              plan_name: product.metadata.plan_name || '',
              credits_included: product.metadata.credits_included || '0',
              upgraded_at: new Date().toISOString(),
              source: 'webapp_upgrade'
            }
          })

          // Return success response for direct upgrade
          return NextResponse.json({ 
            upgraded: true,
            subscriptionId: updatedSubscription.id,
            message: 'Subscription upgraded successfully'
          })
        } catch (upgradeError) {
          console.error('Error upgrading subscription:', upgradeError)
          // Fall back to creating a new subscription if upgrade fails
          // This should cancel the old subscription via webhook
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
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        plan_name: product.metadata.plan_name || '',
        credits_included: product.metadata.credits_included || '0',
        checkout_type: 'subscription',
        created_at: new Date().toISOString()
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email || '',
          plan_name: product.metadata.plan_name || '',
          credits_included: product.metadata.credits_included || '0',
          created_at: new Date().toISOString(),
          source: 'webapp_checkout'
        }
      },
      success_url: successUrl,
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