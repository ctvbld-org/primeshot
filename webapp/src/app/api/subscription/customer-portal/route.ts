import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as any
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user, supabase)
    if (!customerId) {
      return NextResponse.json(
        { error: 'No email associated with user to locate Stripe customer' },
        { status: 400 }
      )
    }

    // Check for flow requests
    const url = new URL(request.url)
    const flow = url.searchParams.get('flow')
    const wantsCancelFlow = flow === 'cancel'
    const wantsUpdateConfirmFlow = flow === 'subscription_update_confirm'
    let subscriptionId = url.searchParams.get('subscriptionId') || undefined
    const priceId = url.searchParams.get('priceId') || undefined

    // Always resolve the current subscription ID for flows to ensure it's valid
    if (wantsCancelFlow || wantsUpdateConfirmFlow) {
      const currentSubId = await resolveSubscriptionId(user.id, customerId, supabase)
      if (currentSubId) {
        subscriptionId = currentSubId
      }
    }

    // Create portal session - construct return URL properly
    // Use the request origin to maintain the same access pattern (direct vs rewrite)
    const requestUrl = new URL(request.url)
    // Extract the base path from the request URL (everything before /api/)
    const pathBeforeApi = requestUrl.pathname.split('/api/')[0] || ''
    const returnUrl = `${requestUrl.protocol}//${requestUrl.host}${pathBeforeApi}`
    const sessionConfig: any = {
      customer: customerId,
      return_url: returnUrl,
    }

    // Add flow data if requested
    if (wantsCancelFlow && subscriptionId) {
      sessionConfig.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: { subscription: subscriptionId },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: returnUrl }
        }
      }
    } else if (wantsUpdateConfirmFlow && subscriptionId && priceId) {
      // Get the subscription from Stripe to find the subscription item ID
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const subscriptionItemId = subscription.items.data[0]?.id
      
      if (!subscriptionItemId) {
        throw new Error('No subscription items found')
      }
      
      sessionConfig.flow_data = {
        type: 'subscription_update_confirm',
        subscription_update_confirm: { 
          subscription: subscriptionId,
          items: [{
            id: subscriptionItemId,
            price: priceId,
            quantity: 1
          }]
        },
        after_completion: {
          type: 'redirect',
          redirect: { return_url: returnUrl }
        }
      }
    }

    const session = await stripe.billingPortal.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}

async function getOrCreateStripeCustomer(
  user: any,
  supabase: any
): Promise<string | null> {
  // Try to find existing customer ID from subscription records
  const { data: subRow } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subRow?.stripe_customer_id) {
    return subRow.stripe_customer_id
  }

  if (!user.email) return null

  // Look up or create customer in Stripe
  const customers = await stripe.customers.list({ email: user.email, limit: 1 })
  
  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: user.id }
  })

  return customer.id
}

async function resolveSubscriptionId(
  userId: string,
  customerId: string,
  supabase: any
): Promise<string | undefined> {
  // Always check Stripe first for the most current active subscription
  const subs = await stripe.subscriptions.list({ 
    customer: customerId, 
    status: 'active', 
    limit: 1 
  })
  
  if (subs.data[0]?.id) {
    return subs.data[0].id
  }

  // Fallback to database (for canceled but still valid subscriptions)
  const { data: latestSub } = await supabase
    .from('user_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latestSub?.stripe_subscription_id
}