import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any
})

export async function POST(request: NextRequest) {
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

      // Calculate days remaining for UI display
      const periodStart = new Date((currentSubscription as any).current_period_start * 1000)
      const periodEnd = new Date((currentSubscription as any).current_period_end * 1000)
      const now = new Date()
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
      const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Calculate current and new amounts for display
      const currentAmount = currentItem.price.unit_amount || 0
      const newAmount = price.unit_amount || 0

      // Get exact proration from Stripe using the new create_preview API
      try {
        // Use Stripe's create_preview API via raw request
        const response = await fetch('https://api.stripe.com/v1/invoices/create_preview', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            customer: existingSubscription.stripe_customer_id,
            subscription: existingSubscription.stripe_subscription_id,
            'subscription_details[items][0][id]': currentItem.id,
            'subscription_details[items][0][price]': priceId,
            'subscription_details[proration_behavior]': 'always_invoice'
          })
        })
        
        if (response.ok) {
          const previewInvoice = await response.json()
          
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
              proratedAmount: previewInvoice.amount_due, // Exact amount from Stripe
              recurringAmount: newAmount, // Future recurring amount (in cents)
              billingInterval: price.recurring?.interval || 'month',
              daysRemaining: remainingDays,
              totalDays: totalDays,
              calculationMethod: 'stripe'
            },
            preview: true
          })
        } else {
          throw new Error(`Stripe API error: ${response.status}`)
        }
      } catch (invoiceError) {
        console.log('Stripe preview invoice API not available, redirecting to customer portal:', (invoiceError as Error).message)
        // Instead of fallback calculation, redirect to Stripe customer portal
        return NextResponse.json({
          redirect: true,
          redirectUrl: '/api/subscription/customer-portal',
          message: 'Preview unavailable. Redirecting to Stripe customer portal for subscription management.'
        })
      }



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