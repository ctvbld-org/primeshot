import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil' as any
})

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's subscription to find their Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Create customer portal session with subscription update capabilities
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${process.env.NEXT_PUBLIC_POST_LOGIN_PATH}`,
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice'
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end'
        },
        payment_method_update: {
          enabled: true
        },
        invoice_history: {
          enabled: true
        }
      }
    } as any)

    return NextResponse.json({
      url: session.url
    })

  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
} 