import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createSecuredHandler, SECURITY_PRESETS } from '@/lib/security-middleware'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

async function handlePOST(request: NextRequest) {
  try {
    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing required field: priceId' },
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

    // Check if user has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan_name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!existingSubscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    try {
      // Get current subscription from Stripe
      const currentSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id, {
        expand: ['items.data.price.product']
      })
      
      // Get current plan details
      const currentItem = currentSubscription.items.data[0]
      const currentProduct = currentItem.price.product as Stripe.Product

      // Calculate current and new amounts for display
      const currentAmount = currentItem.price.unit_amount || 0
      const newAmount = price.unit_amount || 0

      // With the new upgrade system, we show the full price of the new subscription
      // No proration - user pays full price and starts a new billing cycle
      return NextResponse.json({
        currentPlan: {
          name: existingSubscription.plan_name,
          displayName: currentProduct.name,
          price: currentAmount
        },
        newPlan: {
          name: product.metadata.plan_name || '',
          displayName: product.name,
          price: newAmount
        },
        billing: {
          upgradeAmount: newAmount, // Full price of new subscription
          recurringAmount: newAmount, // Future recurring amount (in cents)
          billingInterval: price.recurring?.interval || 'month',
          isFullPrice: true, // Indicates this is not prorated
          calculationMethod: 'full_price'
        },
        preview: true
      })



    } catch (stripeError) {
      console.error('Error previewing upgrade:', stripeError)
      return NextResponse.json(
        { error: 'Failed to preview upgrade costs' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in preview upgrade API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

// Secured handler with authentication and rate limiting
const securedPOST = createSecuredHandler(
  handlePOST,
  SECURITY_PRESETS.USER_DATA
);

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}