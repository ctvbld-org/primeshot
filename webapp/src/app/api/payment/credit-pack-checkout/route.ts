import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

async function handlePOST(request: NextRequest) {
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

    // Ensure user has an active subscription before purchasing credit packs
    const { data: activeSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'You must have an active subscription to purchase credit packs' },
        { status: 403 }
      )
    }

    // Validate the price ID exists and is a one-time payment
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    })

    if (!price.active || price.type !== 'one_time') {
      return NextResponse.json(
        { error: 'Invalid credit pack price ID' },
        { status: 400 }
      )
    }

    const product = price.product as Stripe.Product

    // Validate it's a credit pack
    if (product.metadata.tier_type !== 'credit_pack') {
      return NextResponse.json(
        { error: 'Invalid credit pack product' },
        { status: 400 }
      )
    }

    // Create or get customer
    let customerId: string

    // Check if user already has a Stripe customer ID
    const { data: existingCustomer } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      // Create new customer
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
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        pack_type: 'credit_pack',
        credits: product.metadata.credits || '0',
        validity_days: product.metadata.validity_days || '60',
        checkout_type: 'credit_pack',
        created_at: new Date().toISOString()
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email || '',
          pack_type: 'credit_pack',
          credits: product.metadata.credits || '0',
          validity_days: product.metadata.validity_days || '60',
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
    console.error('Error creating credit pack checkout session:', error)
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